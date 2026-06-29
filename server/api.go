package main

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost/server/public/plugin"

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
	protected.HandleFunc("/projects", p.handleGetProjects).Methods(http.MethodGet)
	protected.HandleFunc("/tasks", p.handleGetTasks).Methods(http.MethodGet)
	protected.HandleFunc("/time-entries/aggregate", p.handleGetTimeEntriesAggregate).Methods(http.MethodGet)
	protected.HandleFunc("/time-entries", p.handleGetTimeEntries).Methods(http.MethodGet)
	protected.HandleFunc("/time-entries", p.handleCreateTimeEntry).Methods(http.MethodPost)
	protected.HandleFunc("/time-entries/{id}", p.handleUpdateTimeEntry).Methods(http.MethodPut)

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
			writeAPIError(w, http.StatusUnauthorized, "not_connected", "Not connected to Solidtime", nil)
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

func (p *Plugin) handleConnectionStatus(w http.ResponseWriter, r *http.Request) {
	connected, err := p.connectionService.IsConnected(userIDFromCtx(r))
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "internal_error", err.Error(), nil)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"connected": connected})
}

func (p *Plugin) handleConnectionConnect(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token string `json:"token"`
	}
	if err := readJSON(r, &body); err != nil {
		writeAPIError(w, http.StatusBadRequest, "invalid_body", "Invalid request body", nil)
		return
	}
	result, err := p.connectionService.Connect(userIDFromCtx(r), body.Token)
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

	clientNames := make(map[string]string, len(clients))
	for _, c := range clients {
		clientNames[c.ID] = c.Name
	}

	type enrichedProject struct {
		ID         string  `json:"id"`
		Name       string  `json:"name"`
		Color      string  `json:"color"`
		ClientID   *string `json:"client_id"`
		ClientName *string `json:"client_name"`
		IsBillable bool    `json:"is_billable"`
	}

	out := make([]enrichedProject, 0, len(projects))
	for _, pr := range projects {
		ep := enrichedProject{
			ID:         pr.ID,
			Name:       pr.Name,
			Color:      pr.Color,
			ClientID:   pr.ClientID,
			IsBillable: pr.IsBillable,
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

func (p *Plugin) handleGetTasks(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value(ctxOrgID).(string)
	projectID := r.URL.Query().Get("project_id")
	if projectID == "" {
		writeAPIError(w, http.StatusBadRequest, "missing_project_id", "project_id is required", nil)
		return
	}
	tasks, err := authClientFromCtx(p, r).GetTasks(orgID, projectID)
	if err != nil {
		p.writeSolidtimeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"tasks": tasks})
}

func (p *Plugin) handleGetTimeEntries(w http.ResponseWriter, r *http.Request) {
	orgID := r.Context().Value(ctxOrgID).(string)
	memberID := r.Context().Value(ctxMemberID).(string)
	q := r.URL.Query()

	limit := 100
	if v := q.Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}
	offset := 0
	if v := q.Get("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = n
		}
	}

	entries, err := authClientFromCtx(p, r).GetTimeEntries(orgID, solidtime.TimeEntryListParams{
		MemberID: memberID,
		Start:    q.Get("start"),
		End:      q.Get("end"),
		Limit:    limit,
		Offset:   offset,
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
	writeJSON(w, http.StatusOK, entry)
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
