package main

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mattermost/mattermost-plugin-starter-template/server/connection"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConnectionStatusNotConnected(t *testing.T) {
	kv := &mockKVStore{}
	svc := connection.NewService(kv, nil, func() string { return "https://app.solidtime.io" }, noopPublisher{})

	plugin := &Plugin{connectionService: svc}
	plugin.router = plugin.initRouter()

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/api/v1/connection/status", nil)
	r.Header.Set("Mattermost-User-ID", "user-1")

	plugin.ServeHTTP(nil, w, r)

	result := w.Result()
	require.Equal(t, http.StatusOK, result.StatusCode)
	defer func() { _ = result.Body.Close() }()

	body, err := io.ReadAll(result.Body)
	require.NoError(t, err)

	var resp map[string]bool
	require.NoError(t, json.Unmarshal(body, &resp))
	assert.False(t, resp["connected"])
}

type mockKVStore struct {
	connected bool
	token     string
	orgID     string
	memberID  string
}

func (m *mockKVStore) SetToken(userID, token string) error {
	m.token = token
	m.connected = true
	return nil
}

func (m *mockKVStore) GetToken(userID string) (string, bool, error) {
	if m.token == "" {
		return "", false, nil
	}
	return m.token, true, nil
}

func (m *mockKVStore) SetOrgID(userID, orgID string) error { m.orgID = orgID; return nil }

func (m *mockKVStore) GetOrgID(userID string) (string, bool, error) {
	if m.orgID == "" {
		return "", false, nil
	}
	return m.orgID, true, nil
}

func (m *mockKVStore) SetMemberID(userID, memberID string) error { m.memberID = memberID; return nil }

func (m *mockKVStore) GetMemberID(userID string) (string, bool, error) {
	if m.memberID == "" {
		return "", false, nil
	}
	return m.memberID, true, nil
}

func (m *mockKVStore) DeleteUserData(userID string) error {
	m.connected = false
	m.token = ""
	m.orgID = ""
	m.memberID = ""
	return nil
}

func (m *mockKVStore) IsConnected(userID string) (bool, error) {
	return m.token != "", nil
}

type noopPublisher struct{}

func (noopPublisher) PublishWebSocketEvent(event string, data map[string]any, broadcast *model.WebsocketBroadcast) {
}
