package connection

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-starter-template/server/solidtime"
	"github.com/mattermost/mattermost-plugin-starter-template/server/store/kvstore"
)

const (
	WebSocketEvent      = "solidtime-connection-change"
	WebSocketEventOrg   = "solidtime-org-change"
	WebSocketEventTimer = "solidtime-timer-change"
)

// ErrNotConnected means the user has no valid Solidtime session in KV store.
var ErrNotConnected = errors.New("not_connected")

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

func membershipsFromSolidtime(ms []solidtime.PersonalMembership) []kvstore.OrgMembership {
	out := make([]kvstore.OrgMembership, len(ms))
	for i, m := range ms {
		out[i] = kvstore.OrgMembership{
			OrgID:    m.Organization.ID,
			MemberID: m.ID,
			OrgName:  m.Organization.Name,
		}
	}
	return out
}

func pickOrg(memberships []kvstore.OrgMembership, previousOrgID string) kvstore.OrgMembership {
	if previousOrgID != "" {
		for _, m := range memberships {
			if m.OrgID == previousOrgID {
				return m
			}
		}
	}
	return memberships[0]
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

	raw, err := auth.GetMemberships()
	if err != nil {
		return nil, errors.Wrap(err, "failed to get memberships")
	}
	if len(raw) == 0 {
		return nil, errors.New("no organizations found in your Solidtime account")
	}

	memberships := membershipsFromSolidtime(raw)
	previousOrgID, _, _ := s.store.GetOrgID(userID)
	selected := pickOrg(memberships, previousOrgID)

	if err := s.store.SetMemberships(userID, memberships); err != nil {
		return nil, err
	}
	if err := s.store.SetOrgID(userID, selected.OrgID); err != nil {
		return nil, err
	}
	if err := s.store.SetMemberID(userID, selected.MemberID); err != nil {
		return nil, err
	}
	if err := s.store.SetToken(userID, token); err != nil {
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
	_, _, _, err := s.ResolveOrgMember(userID)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, ErrNotConnected) {
		return false, nil
	}
	return false, err
}

func (s *Service) ListOrganizations(userID string) ([]kvstore.OrgMembership, error) {
	memberships, ok, err := s.store.GetMemberships(userID)
	if err != nil {
		return nil, err
	}
	if ok {
		return memberships, nil
	}
	return s.refreshMemberships(userID)
}

func (s *Service) SetCurrentOrganization(userID, orgID string) error {
	memberships, err := s.ListOrganizations(userID)
	if err != nil {
		return err
	}
	for _, m := range memberships {
		if m.OrgID == orgID {
			if err := s.store.SetOrgID(userID, m.OrgID); err != nil {
				return err
			}
			if err := s.store.SetMemberID(userID, m.MemberID); err != nil {
				return err
			}
			s.PublishOrgChange(userID, orgID)
			return nil
		}
	}
	return fmt.Errorf("organization not found")
}

func (s *Service) refreshMemberships(userID string) ([]kvstore.OrgMembership, error) {
	token, ok, err := s.store.GetToken(userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, ErrNotConnected
	}
	raw, err := s.stClient.WithToken(token).GetMemberships()
	if err != nil {
		return nil, err
	}
	if len(raw) == 0 {
		return nil, errors.New("no organizations found")
	}
	memberships := membershipsFromSolidtime(raw)
	if err := s.store.SetMemberships(userID, memberships); err != nil {
		return nil, err
	}
	return memberships, nil
}

func (s *Service) PublishConnectionChange(userID string, connected bool) {
	if s.publisher == nil {
		return
	}
	s.publisher.PublishWebSocketEvent(WebSocketEvent, map[string]any{
		"connected": connected,
	}, &model.WebsocketBroadcast{UserId: userID})
}

func (s *Service) PublishOrgChange(userID, orgID string) {
	if s.publisher == nil {
		return
	}
	s.publisher.PublishWebSocketEvent(WebSocketEventOrg, map[string]any{
		"organization_id": orgID,
	}, &model.WebsocketBroadcast{UserId: userID})
}

func timerWSData(active *solidtime.TimeEntry) any {
	if active == nil {
		return nil
	}
	// ponytail: MM plugin WS RPC uses gob; structs in map[string]any crash the plugin
	raw, err := json.Marshal(active)
	if err != nil {
		return nil
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil
	}
	return out
}

func (s *Service) PublishTimerChange(userID string, active *solidtime.TimeEntry) {
	if s.publisher == nil {
		return
	}
	s.publisher.PublishWebSocketEvent(WebSocketEventTimer, map[string]any{
		"active": timerWSData(active),
	}, &model.WebsocketBroadcast{UserId: userID})
}

func (s *Service) ensureOrgMember(userID string) (orgID, memberID string, err error) {
	orgID, orgOk, err := s.store.GetOrgID(userID)
	if err != nil {
		return "", "", err
	}
	memberID, memberOk, err := s.store.GetMemberID(userID)
	if err != nil {
		return "", "", err
	}
	if orgOk && memberOk {
		return orgID, memberID, nil
	}

	memberships, err := s.ListOrganizations(userID)
	if err != nil {
		return "", "", err
	}
	if len(memberships) == 0 {
		return "", "", ErrNotConnected
	}

	selected := pickOrg(memberships, orgID)
	if err := s.store.SetOrgID(userID, selected.OrgID); err != nil {
		return "", "", err
	}
	if err := s.store.SetMemberID(userID, selected.MemberID); err != nil {
		return "", "", err
	}
	return selected.OrgID, selected.MemberID, nil
}

func (s *Service) ResolveOrgMember(userID string) (orgID, memberID, token string, err error) {
	token, ok, err := s.store.GetToken(userID)
	if err != nil {
		return "", "", "", err
	}
	if !ok {
		return "", "", "", ErrNotConnected
	}
	orgID, memberID, err = s.ensureOrgMember(userID)
	if err != nil {
		return "", "", "", err
	}
	return orgID, memberID, token, nil
}
