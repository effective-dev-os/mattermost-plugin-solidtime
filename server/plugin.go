package main

import (
	"net/http"
	"sync"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
	"github.com/mattermost/mattermost/server/public/pluginapi"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-starter-template/server/command"
	"github.com/mattermost/mattermost-plugin-starter-template/server/connection"
	"github.com/mattermost/mattermost-plugin-starter-template/server/solidtime"
	"github.com/mattermost/mattermost-plugin-starter-template/server/store/kvstore"
)

type Plugin struct {
	plugin.MattermostPlugin

	kvstore           kvstore.KVStore
	client            *pluginapi.Client
	commandClient     command.Command
	connectionService *connection.Service
	solidtimeClient   *solidtime.Client
	router            *mux.Router

	configurationLock sync.RWMutex
	configuration     *configuration
}

func (p *Plugin) isConfigured() bool {
	return p.getConfiguration().SolidtimeServerURL != ""
}

func (p *Plugin) OnActivate() error {
	p.client = pluginapi.NewClient(p.API, p.Driver)
	p.kvstore = kvstore.NewKVStore(p.client)

	if err := p.OnConfigurationChange(); err != nil {
		return err
	}

	if !p.isConfigured() {
		return errors.New("Solidtime Server URL is required. Set it in System Console → Plugins → Solidtime before enabling the plugin.")
	}

	p.connectionService = connection.NewService(
		p.kvstore,
		p.solidtimeClient,
		func() string { return p.getConfiguration().SolidtimeServerURL },
		p,
	)

	p.commandClient = command.NewCommandHandler(p.connectionService)

	if err := p.client.SlashCommand.Register(&model.Command{
		Trigger:          command.CommandTrigger(),
		AutoComplete:     true,
		AutoCompleteDesc: "Solidtime time tracker",
		AutoCompleteHint: "[connect|disconnect]",
		AutocompleteData: command.AutocompleteData(),
	}); err != nil {
		return errors.Wrap(err, "failed to register slash command")
	}

	p.router = p.initRouter()
	return nil
}

func (p *Plugin) ExecuteCommand(c *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	response, err := p.commandClient.Handle(args)
	if err != nil {
		return nil, model.NewAppError("ExecuteCommand", "plugin.command.execute_command.app_error", nil, err.Error(), http.StatusInternalServerError)
	}
	return response, nil
}

func (p *Plugin) PublishWebSocketEvent(event string, data map[string]any, broadcast *model.WebsocketBroadcast) {
	p.API.PublishWebSocketEvent(event, data, broadcast)
}

func newSolidtimeClient(serverURL string) *solidtime.Client {
	if serverURL == "" {
		return nil
	}
	return solidtime.NewClient(serverURL)
}
