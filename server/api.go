package main

import (
	"context"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost/server/public/plugin"
	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-starter-template/server/connection"
	"github.com/mattermost/mattermost-plugin-starter-template/server/solidtime"
)

type ctxKey string

const (
	ctxUserID   ctxKey = "userID"
	ctxToken    ctxKey = "token"
	ctxOrgID    ctxKey = "orgID"
	ctxMemberID ctxKey = "memberID"
)

func (p *Plugin) initRouter() *mux.Router {
	router := mux.NewRouter()
	router.Use(p.mattermostUserRequired)

	apiRouter := router.PathPrefix("/api/v1").Subrouter()

	apiRouter.HandleFunc("/connection/status", p.handleConnectionStatus).Methods(http.MethodGet)
	apiRouter.HandleFunc("/connection/connect", p.handleConnectionConnect).Methods(http.MethodPost)
	apiRouter.HandleFunc("/connection/disconnect", p.handleConnectionDisconnect).Methods(http.MethodDelete)

	protected := apiRouter.PathPrefix("").Subrouter()
	protected.Use(p.solidtimeConnectedRequired)
	protected.HandleFunc("/organizations", p.handleGetOrganizations).Methods(http.MethodGet)
	protected.HandleFunc("/organizations/current", p.handleSetCurrentOrganization).Methods(http.MethodPut)
	protected.HandleFunc("/projects", p.handleGetProjects).Methods(http.MethodGet)
	protected.HandleFunc("/time-entries/active", p.handleGetActiveTimeEntry).Methods(http.MethodGet)
	protected.HandleFunc("/time-entries/aggregate", p.handleGetTimeEntriesAggregate).Methods(http.MethodGet)
	protected.HandleFunc("/time-entries", p.handleGetTimeEntries).Methods(http.MethodGet)
	protected.HandleFunc("/time-entries", p.handleCreateTimeEntry).Methods(http.MethodPost)
	protected.HandleFunc("/time-entries/{id}", p.handleUpdateTimeEntry).Methods(http.MethodPut)
	protected.HandleFunc("/time-entries/{id}", p.handleDeleteTimeEntry).Methods(http.MethodDelete)

	return router
}

func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	p.router.ServeHTTP(w, r)
}

func (p *Plugin) mattermostUserRequired(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get("Mattermost-User-ID")
		if userID == "" {
			writeAPIError(w, http.StatusUnauthorized, "unauthorized", "Not authorized", nil)
			return
		}
		ctx := context.WithValue(r.Context(), ctxUserID, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (p *Plugin) solidtimeConnectedRequired(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value(ctxUserID).(string)
		orgID, memberID, token, err := p.connectionService.ResolveOrgMember(userID)
		if err != nil {
			if errors.Is(err, connection.ErrNotConnected) {
				writeAPIError(w, http.StatusUnauthorized, "not_connected", "Not connected to Solidtime", nil)
			} else {
				writeAPIError(w, http.StatusInternalServerError, "internal_error", err.Error(), nil)
			}
			return
		}
		ctx := r.Context()
		ctx = context.WithValue(ctx, ctxToken, token)
		ctx = context.WithValue(ctx, ctxOrgID, orgID)
		ctx = context.WithValue(ctx, ctxMemberID, memberID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func userIDFromCtx(r *http.Request) string {
	return r.Context().Value(ctxUserID).(string)
}

func authClientFromCtx(p *Plugin, r *http.Request) *solidtime.AuthenticatedClient {
	token := r.Context().Value(ctxToken).(string)
	return p.solidtimeClient.WithToken(token)
}

func (p *Plugin) publishActiveTimer(r *http.Request) {
	userID := userIDFromCtx(r)
	active, err := authClientFromCtx(p, r).GetActiveTimeEntry()
	if err != nil {
		p.API.LogWarn("failed to fetch active timer for WS publish", "error", err.Error())
		return
	}
	p.connectionService.PublishTimerChange(userID, active)
}

func (p *Plugin) handleConnectionStatus(w http.ResponseWriter, r *http.Request) {
	connected, err := p.connectionService.IsConnected(userIDFromCtx(r))
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "internal_error", err.Error(), nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"connected":  connected,
		"server_url": p.getConfiguration().SolidtimeServerURL,
	})
}

func (p *Plugin) handleConnectionConnect(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token string `json:"token"`
	}
	if err := readJSON(r, &body); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_body", "Invalid request body", nil)
		return
	}
	result, err := p.connectionService.Connect(userIDFromCtx(r), strings.TrimSpace(body.Token))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "connect_failed", err.Error(), nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"connected": true, "user_name": result.UserName})
}

func (p *Plugin) handleConnectionDisconnect(w http.ResponseWriter, r *http.Request) {
	if err := p.connectionService.Disconnect(userIDFromCtx(r)); err != nil {
		writeAPIError(w, http.StatusInternalServerError, "disconnect_failed", err.Error(), nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"connected": false})
}

func (p *Plugin) handleGetOrganizations(w http.ResponseWriter, r *http.Request) {
	orgs, err := p.connectionService.ListOrganizations(userIDFromCtx(r))
	if err != nil {
		writeAPIError(w, http.StatusBadRequest, "organizations_failed", err.Error(), nil)
		return
	}
	currentOrgID := r.Context().Value(ctxOrgID).(string)
	writeJSON(w, http.StatusOK, map[string]any{
		"organizations": orgs,
		"current_id":    currentOrgID,
	})
}

func (p *Plugin) handleSetCurrentOrganization(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OrganizationID string `json:"organization_id"`
	}
	if err := readJSON(r, &body); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_body", "Invalid request body", nil)
		return
	}
	if body.OrganizationID == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_org_id", "organization_id is required", nil)
		return
	}
	userID := userIDFromCtx(r)
	if err := p.connectionService.SetCurrentOrganization(userID, body.OrganizationID); err != nil {
		writeAPIError(w, http.StatusBadRequest, "set_org_failed", err.Error(), nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"organization_id": body.OrganizationID})
}

func (p *Plugin) handleGetProjects(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value(ctxOrgID).(string)
	auth := authClientFromCtx(p, r)

	projects, err := auth.GetProjects(orgID)
	if err != nil {
		p.writeSolidtimeError(w, err)
		return
	}
	clients, err := auth.GetClients(orgID)
	if err != nil {
		p.writeSolidtimeError(w, err)
		return
	}
	tasks, err := auth.GetAllTasks(orgID)
	if err != nil {
		p.writeSolidtimeError(w, err)
		return
	}

	clientNames := make(map[string]string, len(clients))
	for _, c := range clients {
		clientNames[c.ID] = c.Name
	}

	type enrichedTask struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		IsDone    bool   `json:"is_done"`
		ProjectID string `json:"project_id"`
	}

	tasksByProject := make(map[string][]enrichedTask)
	for _, t := range tasks {
		tasksByProject[t.ProjectID] = append(tasksByProject[t.ProjectID], enrichedTask{
			ID:        t.ID,
			Name:      t.Name,
			IsDone:    t.IsDone,
			ProjectID: t.ProjectID,
		})
	}

	type enrichedProject struct {
		ID         string         `json:"id"`
		Name       string         `json:"name"`
		Color      string         `json:"color"`
		ClientID   *string        `json:"client_id"`
		ClientName *string        `json:"client_name"`
		IsBillable bool           `json:"is_billable"`
		IsArchived bool           `json:"is_archived"`
		Tasks      []enrichedTask `json:"tasks"`
	}

	out := make([]enrichedProject, 0, len(projects))
	for _, pr := range projects {
		ep := enrichedProject{
			ID:         pr.ID,
			Name:       pr.Name,
			Color:      pr.Color,
			ClientID:   pr.ClientID,
			IsBillable: pr.IsBillable,
			IsArchived: pr.IsArchived,
			Tasks:      tasksByProject[pr.ID],
		}
		if ep.Tasks == nil {
			ep.Tasks = []enrichedTask{}
		}
		if pr.ClientID != nil {
			if name, ok := clientNames[*pr.ClientID]; ok {
				ep.ClientName = &name
			}
		}
		out = append(out, ep)
	}

	writeJSON(w, http.StatusOK, map[string]any{"projects": out})
}

func (p *Plugin) handleGetActiveTimeEntry(w http.ResponseWriter, r *http.Request) {
	entry, err := authClientFromCtx(p, r).GetActiveTimeEntry()
	if err != nil {
		p.writeSolidtimeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"active": entry})
}

func (p *Plugin) handleGetTimeEntries(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value(ctxOrgID).(string)
	memberID := r.Context().Value(ctxMemberID).(string)
	q := r.URL.Query()

	entries, err := authClientFromCtx(p, r).GetAllTimeEntries(orgID, solidtime.TimeEntryListParams{
		MemberID: memberID,
		Start:    q.Get("start"),
		End:      q.Get("end"),
		Active:   "false",
	})
	if err != nil {
		p.writeSolidtimeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"entries": entries})
}

func (p *Plugin) handleCreateTimeEntry(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value(ctxOrgID).(string)
	memberID := r.Context().Value(ctxMemberID).(string)
	userID := userIDFromCtx(r)

	var req solidtime.TimeEntryStoreRequest
	if err := readJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_body", "Invalid request body", nil)
		return
	}
	req.MemberID = memberID

	entry, err := authClientFromCtx(p, r).CreateTimeEntry(orgID, req)
	if err != nil {
		p.writeSolidtimeError(w, err)
		return
	}
	if req.End == nil {
		p.connectionService.PublishTimerChange(userID, entry)
	} else {
		p.publishActiveTimer(r)
	}
	writeJSON(w, http.StatusOK, entry)
}

func (p *Plugin) handleUpdateTimeEntry(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value(ctxOrgID).(string)
	entryID := mux.Vars(r)["id"]

	var req solidtime.TimeEntryUpdateRequest
	if err := readJSON(r, &req); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_body", "Invalid request body", nil)
		return
	}

	entry, err := authClientFromCtx(p, r).UpdateTimeEntry(orgID, entryID, req)
	if err != nil {
		p.writeSolidtimeError(w, err)
		return
	}
	p.publishActiveTimer(r)
	writeJSON(w, http.StatusOK, entry)
}

func (p *Plugin) handleDeleteTimeEntry(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value(ctxOrgID).(string)
	entryID := mux.Vars(r)["id"]

	if err := authClientFromCtx(p, r).DeleteTimeEntry(orgID, entryID); err != nil {
		p.writeSolidtimeError(w, err)
		return
	}
	p.publishActiveTimer(r)
	w.WriteHeader(http.StatusNoContent)
}

func (p *Plugin) handleGetTimeEntriesAggregate(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value(ctxOrgID).(string)
	memberID := r.Context().Value(ctxMemberID).(string)
	q := r.URL.Query()

	seconds, err := authClientFromCtx(p, r).GetTimeEntriesAggregate(orgID, solidtime.AggregateParams{
		MemberID: memberID,
		Start:    q.Get("start"),
		End:      q.Get("end"),
	})
	if err != nil {
		p.writeSolidtimeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{"seconds": seconds})
}

func (p *Plugin) writeSolidtimeError(w http.ResponseWriter, err error) {
	if apiErr, ok := solidtime.AsAPIError(err); ok {
		writeAPIError(w, apiErr.StatusCode, apiErr.Code, apiErr.Message, apiErr.Details)
		return
	}
	writeAPIError(w, http.StatusInternalServerError, "internal_error", err.Error(), nil)
}
