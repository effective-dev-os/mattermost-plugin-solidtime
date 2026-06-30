package connection_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mattermost/mattermost-plugin-starter-template/server/connection"
	"github.com/mattermost/mattermost-plugin-starter-template/server/solidtime"
	"github.com/mattermost/mattermost-plugin-starter-template/server/store/kvstore"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockKVStore struct {
	token       string
	orgID       string
	memberID    string
	memberships []kvstore.OrgMembership
}

func (m *mockKVStore) SetMemberships(userID string, memberships []kvstore.OrgMembership) error {
	m.memberships = memberships
	return nil
}

func (m *mockKVStore) GetMemberships(userID string) ([]kvstore.OrgMembership, bool, error) {
	if len(m.memberships) == 0 {
		return nil, false, nil
	}
	return m.memberships, true, nil
}

func (m *mockKVStore) SetToken(userID, token string) error {
	m.token = token
	return nil
}

func (m *mockKVStore) GetToken(userID string) (string, bool, error) {
	if m.token == "" {
		return "", false, nil
	}
	return m.token, true, nil
}

func (m *mockKVStore) SetOrgID(userID, orgID string) error {
	m.orgID = orgID
	return nil
}

func (m *mockKVStore) GetOrgID(userID string) (string, bool, error) {
	if m.orgID == "" {
		return "", false, nil
	}
	return m.orgID, true, nil
}

func (m *mockKVStore) SetMemberID(userID, memberID string) error {
	m.memberID = memberID
	return nil
}

func (m *mockKVStore) GetMemberID(userID string) (string, bool, error) {
	if m.memberID == "" {
		return "", false, nil
	}
	return m.memberID, true, nil
}

func (m *mockKVStore) DeleteUserData(userID string) error {
	m.token = ""
	m.orgID = ""
	m.memberID = ""
	m.memberships = nil
	return nil
}

func TestResolveOrgMemberRepairsMissingMemberFromCache(t *testing.T) {
	kv := &mockKVStore{
		token: "tok",
		orgID: "org-1",
		memberships: []kvstore.OrgMembership{
			{OrgID: "org-1", MemberID: "mem-1", OrgName: "Acme"},
		},
	}
	svc := connection.NewService(kv, nil, func() string { return "https://app.solidtime.io" }, nil)

	orgID, memberID, token, err := svc.ResolveOrgMember("user-1")
	require.NoError(t, err)
	assert.Equal(t, "org-1", orgID)
	assert.Equal(t, "mem-1", memberID)
	assert.Equal(t, "tok", token)
	assert.Equal(t, "mem-1", kv.memberID)
}

func TestResolveOrgMemberFetchesMembershipsWhenCacheEmpty(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/api/v1/users/me/memberships", r.URL.Path)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"data": []map[string]any{
				{
					"id":   "mem-1",
					"role": "member",
					"organization": map[string]string{
						"id":       "org-1",
						"name":     "Acme",
						"currency": "USD",
					},
				},
			},
		})
	}))
	defer server.Close()

	kv := &mockKVStore{token: "tok", orgID: "org-1"}
	stClient := solidtime.NewClient(server.URL)
	svc := connection.NewService(kv, stClient, func() string { return server.URL }, nil)

	orgID, memberID, _, err := svc.ResolveOrgMember("user-1")
	require.NoError(t, err)
	assert.Equal(t, "org-1", orgID)
	assert.Equal(t, "mem-1", memberID)
	assert.Equal(t, "mem-1", kv.memberID)
	assert.Len(t, kv.memberships, 1)
}

func TestPublishTimerChangeUsesPlainMap(t *testing.T) {
	var published map[string]any
	svc := connection.NewService(nil, nil, func() string { return "" }, publisherFunc(func(_ string, data map[string]any, _ *model.WebsocketBroadcast) {
		published = data
	}))

	end := "2026-06-30T12:00:00Z"
	svc.PublishTimerChange("user-1", &solidtime.TimeEntry{
		ID:    "entry-1",
		Start: "2026-06-30T11:00:00Z",
		End:   &end,
	})

	require.NotNil(t, published)
	active, ok := published["active"].(map[string]any)
	require.True(t, ok, "active must be map[string]any for WS gob encoding")
	assert.Equal(t, "entry-1", active["id"])
}

type publisherFunc func(event string, data map[string]any, broadcast *model.WebsocketBroadcast)

func (f publisherFunc) PublishWebSocketEvent(event string, data map[string]any, broadcast *model.WebsocketBroadcast) {
	f(event, data, broadcast)
}
