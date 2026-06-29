package connection

import (
	"fmt"
	"net/http"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-starter-template/server/solidtime"
	"github.com/mattermost/mattermost-plugin-starter-template/server/store/kvstore"
)

const WebSocketEvent = "solidtime-connection-change"

type Publisher interface {
	PublishWebSocketEvent(event string, data map[string]any, broadcast *model.WebsocketBroadcast)
}

type Service struct {
	store     kvstore.KVStore
	stClient  *solidtime.Client
	serverURL func() string
	publisher Publisher
}

func NewService(store kvstore.KVStore, stClient *solidtime.Client, serverURL func() string, publisher Publisher) *Service {
	return &Service{
		store:     store,
		stClient:  stClient,
		serverURL: serverURL,
		publisher: publisher,
	}
}

func (s *Service) SetSolidtimeClient(stClient *solidtime.Client) {
	s.stClient = stClient
}

type ConnectResult struct {
	UserName string
}

func (s *Service) Connect(userID, token string) (*ConnectResult, error) {
	if s.serverURL() == "" {
		return nil, errors.New("Solidtime Server URL is not configured. Ask your administrator to set it in System Console → Plugins → Solidtime.")
	}
	if s.stClient == nil {
		return nil, errors.New("Solidtime client is not initialized")
	}
	if token == "" {
		return nil, errors.New("API token is required")
	}

	auth := s.stClient.WithToken(token)
	user, err := auth.GetMe()
	if err != nil {
		if apiErr, ok := solidtime.AsAPIError(err); ok && apiErr.StatusCode == http.StatusUnauthorized {
			return nil, errors.New("invalid API token")
		}
		return nil, errors.Wrap(err, "failed to validate token")
	}

	memberships, err := auth.GetMemberships()
	if err != nil {
		return nil, errors.Wrap(err, "failed to get memberships")
	}
	if len(memberships) == 0 {
		return nil, errors.New("no organizations found in your Solidtime account")
	}

	// ponytail: first org only; multi-org is future scope
	m := memberships[0]
	orgID := m.Organization.ID
	memberID := m.ID

	if err := s.store.SetToken(userID, token); err != nil {
		return nil, err
	}
	if err := s.store.SetOrgID(userID, orgID); err != nil {
		return nil, err
	}
	if err := s.store.SetMemberID(userID, memberID); err != nil {
		return nil, err
	}

	s.PublishConnectionChange(userID, true)

	return &ConnectResult{UserName: user.Name}, nil
}

func (s *Service) Disconnect(userID string) error {
	if err := s.store.DeleteUserData(userID); err != nil {
		return err
	}
	s.PublishConnectionChange(userID, false)
	return nil
}

func (s *Service) IsConnected(userID string) (bool, error) {
	return s.store.IsConnected(userID)
}

func (s *Service) PublishConnectionChange(userID string, connected bool) {
	if s.publisher == nil {
		return
	}
	s.publisher.PublishWebSocketEvent(WebSocketEvent, map[string]any{
		"connected": connected,
	}, &model.WebsocketBroadcast{UserId: userID})
}

func (s *Service) ResolveOrgMember(userID string) (orgID, memberID, token string, err error) {
	token, ok, err := s.store.GetToken(userID)
	if err != nil || !ok {
		return "", "", "", fmt.Errorf("not_connected")
	}
	orgID, ok, err = s.store.GetOrgID(userID)
	if err != nil {
		return "", "", "", err
	}
	memberID, okM, err := s.store.GetMemberID(userID)
	if err != nil {
		return "", "", "", err
	}
	if ok && okM {
		return orgID, memberID, token, nil
	}

	auth := s.stClient.WithToken(token)
	memberships, err := auth.GetMemberships()
	if err != nil {
		return "", "", "", err
	}
	if len(memberships) == 0 {
		return "", "", "", errors.New("no organizations found")
	}
	m := memberships[0]
	orgID = m.Organization.ID
	memberID = m.ID
	_ = s.store.SetOrgID(userID, orgID)
	_ = s.store.SetMemberID(userID, memberID)
	return orgID, memberID, token, nil
}
