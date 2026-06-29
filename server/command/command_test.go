package command

import (
	"errors"
	"testing"

	"github.com/mattermost/mattermost-plugin-starter-template/server/connection"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type fakeConnector struct {
	userName string
}

func (f *fakeConnector) Connect(userID, token string) (*connection.ConnectResult, error) {
	if token == "" {
		return nil, errors.New("token required")
	}
	return &connection.ConnectResult{UserName: f.userName}, nil
}

func (f *fakeConnector) Disconnect(userID string) error {
	return nil
}

func TestDisconnectCommand(t *testing.T) {
	h := NewCommandHandler(&fakeConnector{})
	resp, err := h.Handle(&model.CommandArgs{
		UserId:  "u1",
		Command: "/solidtime disconnect",
	})
	require.NoError(t, err)
	assert.Equal(t, model.CommandResponseTypeEphemeral, resp.ResponseType)
	assert.Contains(t, resp.Text, "Disconnected")
}

func TestConnectMissingToken(t *testing.T) {
	h := NewCommandHandler(&fakeConnector{})
	resp, err := h.Handle(&model.CommandArgs{
		UserId:  "u1",
		Command: "/solidtime connect",
	})
	require.NoError(t, err)
	assert.Contains(t, resp.Text, "API token")
}

func TestConnectSuccess(t *testing.T) {
	h := NewCommandHandler(&fakeConnector{userName: "Alice"})
	resp, err := h.Handle(&model.CommandArgs{
		UserId:  "u1",
		Command: "/solidtime connect jwt-token-here",
	})
	require.NoError(t, err)
	assert.Contains(t, resp.Text, "Alice")
}
