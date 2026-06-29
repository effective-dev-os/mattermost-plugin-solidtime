package command

import (
	"fmt"
	"strings"

	"github.com/mattermost/mattermost-plugin-starter-template/server/connection"

	"github.com/mattermost/mattermost/server/public/model"
)

const commandTrigger = "solidtime"

func CommandTrigger() string {
	return commandTrigger
}

type Connector interface {
	Connect(userID, token string) (*connection.ConnectResult, error)
	Disconnect(userID string) error
}

type Handler struct {
	conn Connector
}

type Command interface {
	Handle(args *model.CommandArgs) (*model.CommandResponse, error)
}

func NewCommandHandler(conn Connector) Command {
	return &Handler{conn: conn}
}

func AutocompleteData() *model.AutocompleteData {
	cmd := model.NewAutocompleteData(commandTrigger, "[connect|disconnect]", "Solidtime time tracker")
	connect := model.NewAutocompleteData("connect", "<api_token>", "Connect your Solidtime account")
	disconnect := model.NewAutocompleteData("disconnect", "", "Disconnect your Solidtime account")
	cmd.AddCommand(connect)
	cmd.AddCommand(disconnect)
	return cmd
}

func (c *Handler) Handle(args *model.CommandArgs) (*model.CommandResponse, error) {
	fields := strings.Fields(args.Command)
	if len(fields) < 2 {
		return ephemeral("Usage: `/solidtime connect <api_token>` or `/solidtime disconnect`"), nil
	}

	sub := strings.ToLower(strings.TrimPrefix(fields[1], "/"))
	switch sub {
	case "connect":
		return c.handleConnect(args)
	case "disconnect":
		return c.handleDisconnect(args)
	default:
		return ephemeral(fmt.Sprintf("Unknown subcommand: %s", sub)), nil
	}
}

func (c *Handler) handleConnect(args *model.CommandArgs) (*model.CommandResponse, error) {
	prefix := "/solidtime connect"
	token := strings.TrimSpace(strings.TrimPrefix(args.Command, prefix))
	if token == "" {
		return ephemeral("Please provide an API token: `/solidtime connect <api_token>`"), nil
	}

	result, err := c.conn.Connect(args.UserId, token)
	if err != nil {
		return ephemeral(fmt.Sprintf("Failed to connect: %s", err.Error())), nil
	}

	return ephemeral(fmt.Sprintf("Connected to Solidtime as **%s**.", result.UserName)), nil
}

func (c *Handler) handleDisconnect(args *model.CommandArgs) (*model.CommandResponse, error) {
	if err := c.conn.Disconnect(args.UserId); err != nil {
		return ephemeral(fmt.Sprintf("Failed to disconnect: %s", err.Error())), nil
	}
	return ephemeral("Disconnected from Solidtime."), nil
}

func ephemeral(text string) *model.CommandResponse {
	return &model.CommandResponse{
		ResponseType: model.CommandResponseTypeEphemeral,
		Text:         text,
	}
}
