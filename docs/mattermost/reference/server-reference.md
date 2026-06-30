# Server Plugin SDK Reference (snapshot)

> **Online version:** https://developers.mattermost.com/integrate/reference/server/server-reference/
>
> Local copy for offline reference. If there are discrepancies, the online documentation takes precedence.

---

Source URL: https://developers.mattermost.com/integrate/reference/server/server-reference/
Title:  Server plugin SDK reference

× 

megaphone icon  Mattermost v11.0 is now available! Learn what's new » 

Mattermost Logo 

* Platform  
Platform  
   * Overview  
   * Channels  
   * Playbooks  
   * Integrations  
   * Mobile  
   * Security  
   * Trust Center  
Interoperability  
   * MS Teams  
   * Atlassian  
   * GitLab  
Flexible Deployment  
   * On-Premise  
   * Cloud
* Solutions  
Use Cases  
   * Purpose-Built Collaboration Hub  
   * Self-Sovereign Collaboration  
   * Mission-Critical ChatOps  
   * Real-Time DevSecOps Collaboration  
   * Integrated Security Operations  
   * Out-of-Band Incident Response  
Industries  
   * Critical Infrastructure  
   * Defense  
   * Technology  
   * Global Public Sector  
   * Financial Services  
   * Energy and Utilities  
   * Manufacturing
* Customers  
Customers  
   * USAF  
   * Fujitsu  
   * RTE  
   * CERN  
   * NRI  
   * Pramacom  
   * Crossover Health  
   * Netfoundry  
See more customer stories »
* Pricing
* Partners  
Partners  
   * Become a Partner  
   * Partner Program  
   * Deal Registration
* Resources  
Resources  
   * Resource Library  
   * Blog  
   * Demos  
   * Events  
Documentation  
   * Academy  
   * Channels Guide  
   * Playbooks Guide  
   * Admin  
   * Docs  
   * API Reference  
   * Release Notes  
Community  
   * Join Community  
   * Contribute  
   * Deploy  
   * Integrate  
   * Download
* Login  
Login  
   * My Workspace  
   * Admin Portal  
   * Apps  
   * Support
* Contact Sales

* Contribute
* Integrate & Extend
* API Documentation

Server plugin SDK reference 

 Get started 
 Webhooks 
 Incoming webhooks 
 Outgoing webhooks 
 Slash commands 
 Built-in commands 
 Custom commands 
 Outgoing OAuth connections 
 Slack compatibility 
 Plugins 
 Overview 
 Developer setup 
 Developer workflow 
 Components 
 Server plugins 
 Plugin quick start 
 High availability 
 Best practices 
 Debug Server plugins 
 Web app plugins 
 Web app quick start 
 Redux actions 
 Best practices 
 Mobile plugins 
 Use and manage plugins 
 Migrate plugins 
 Interactive dialogs 
 Interactive messages 
 Example plugins 
 Best practices 
 Plugin helpers 
 Community plugins in the Marketplace 
 Process to include plugin on community 
 Manifest reference 
 Source available license 
 Customize and embed 
 Customize Mattermost 
 Server build (Team Edition) 
 Server files 
 Web app 
 Embed Mattermost 
 Examples 
 Frequently asked questions (FAQ) 
 Quick reference 
 Server plugin SDK reference 
 Web app plugin SDK reference 
 REST API reference 
 Personal access tokens 
 Bot accounts 
 Message attachments 
 Markdown action buttons 
 Message priority 
 Contribute to the Marketplace 
 Integrate with Zapier 

 Edit on GitHub 

#  Mattermost Server plugin SDK reference

This is the documentation for the Go `github.com/mattermost/mattermost/server/public/plugin` package. It can also be found on GoDoc.

Visit the Plugins section to learn more about developing Mattermost plugins and our recommended developer workflow for Mattermost plugins.

---

The plugin package is used by Mattermost server plugins written in go. It also enables the Mattermost server to manage and interact with the running plugin environment.

Note that this package exports a large number of types prefixed with Z\_. These are public only to allow their use with Hashicorp's go-plugin (and net/rpc). Do not use these directly.

## API 

The API can be used to retrieve data or perform actions on behalf of the plugin. Most methods have direct counterparts in the REST API and very similar behavior.

Plugins obtain access to the API by embedding MattermostPlugin and accessing the API member directly.

* GetSession(sessionID string) (\*model.Session, \*model.AppError)
* OpenInteractiveDialog(dialog model.OpenDialogRequest) \*model.AppError
* KVSetWithOptions(key string, value \[\]byte, options model.PluginKVSetOptions) (bool, \*model.AppError)
* PublishWebSocketEvent(event string, payload map\[string\]any, broadcast \*model.WebsocketBroadcast)
* RolesGrantPermission(roleNames \[\]string, permissionId string) bool
* SendMail(to, subject, htmlBody string) \*model.AppError
* PluginHTTP(request \*http.Request) \*http.Response
* PublishPluginClusterEvent(ev model.PluginClusterEvent, opts model.PluginClusterEventSendOptions) error
* RequestTrialLicense(requesterID string, users int, termsAccepted bool, receiveEmailsAccepted bool) \*model.AppError
* GetCloudLimits() (\*model.ProductLimits, error)
* EnsureBotUser(bot \*model.Bot) (string, error)
* RegisterCollectionAndTopic(collectionType, topicType string) error
* SendPushNotification(notification \*model.PushNotification, userID string) \*model.AppError
* Audit  
   * LogAuditRec(rec \*model.AuditRecord)  
   * LogAuditRecWithLevel(rec \*model.AuditRecord, level mlog.Level)
* Bot  
   * CreateBot(bot \*model.Bot) (\*model.Bot, \*model.AppError)  
   * PatchBot(botUserId string, botPatch \*model.BotPatch) (\*model.Bot, \*model.AppError)  
   * GetBot(botUserId string, includeDeleted bool) (\*model.Bot, \*model.AppError)  
   * GetBots(options \*model.BotGetOptions) (\[\]\*model.Bot, \*model.AppError)  
   * UpdateBotActive(botUserId string, active bool) (\*model.Bot, \*model.AppError)  
   * PermanentDeleteBot(botUserId string) \*model.AppError
* Channel  
   * GetUsersInChannel(channelID, sortBy string, page, perPage int) (\[\]\*model.User, \*model.AppError)  
   * CreateChannel(channel \*model.Channel) (\*model.Channel, \*model.AppError)  
   * DeleteChannel(channelId string) \*model.AppError  
   * GetPublicChannelsForTeam(teamID string, page, perPage int) (\[\]\*model.Channel, \*model.AppError)  
   * GetChannel(channelId string) (\*model.Channel, \*model.AppError)  
   * GetChannelByName(teamID, name string, includeDeleted bool) (\*model.Channel, \*model.AppError)  
   * GetChannelByNameForTeamName(teamName, channelName string, includeDeleted bool) (\*model.Channel, \*model.AppError)  
   * GetChannelsForTeamForUser(teamID, userID string, includeDeleted bool) (\[\]\*model.Channel, \*model.AppError)  
   * GetChannelStats(channelId string) (\*model.ChannelStats, \*model.AppError)  
   * GetDirectChannel(userId1, userId2 string) (\*model.Channel, \*model.AppError)  
   * GetGroupChannel(userIds \[\]string) (\*model.Channel, \*model.AppError)  
   * UpdateChannel(channel \*model.Channel) (\*model.Channel, \*model.AppError)  
   * SearchChannels(teamID string, term string) (\[\]\*model.Channel, \*model.AppError)  
   * AddChannelMember(channelId, userID string) (\*model.ChannelMember, \*model.AppError)  
   * AddUserToChannel(channelId, userID, asUserId string) (\*model.ChannelMember, \*model.AppError)  
   * GetChannelMember(channelId, userID string) (\*model.ChannelMember, \*model.AppError)  
   * GetChannelMembers(channelId string, page, perPage int) (model.ChannelMembers, \*model.AppError)  
   * GetChannelMembersByIds(channelId string, userIds \[\]string) (model.ChannelMembers, \*model.AppError)  
   * GetChannelMembersForUser(teamID, userID string, page, perPage int) (\[\]\*model.ChannelMember, \*model.AppError)  
   * UpdateChannelMemberRoles(channelId, userID, newRoles string) (\*model.ChannelMember, \*model.AppError)  
   * UpdateChannelMemberNotifications(channelId, userID string, notifications map\[string\]string) (\*model.ChannelMember, \*model.AppError)  
   * PatchChannelMembersNotifications(members \[\]\*model.ChannelMemberIdentifier, notifyProps map\[string\]string) \*model.AppError  
   * DeleteChannelMember(channelId, userID string) \*model.AppError  
   * GetPostsSince(channelId string, time int64) (\*model.PostList, \*model.AppError)  
   * GetPostsAfter(channelId, postId string, page, perPage int) (\*model.PostList, \*model.AppError)  
   * GetPostsBefore(channelId, postId string, page, perPage int) (\*model.PostList, \*model.AppError)  
   * GetPostsForChannel(channelId string, page, perPage int) (\*model.PostList, \*model.AppError)  
   * UploadFile(data \[\]byte, channelId string, filename string) (\*model.FileInfo, \*model.AppError)  
   * HasPermissionToChannel(userID, channelId string, permission \*model.Permission) bool
* ChannelSidebar  
   * CreateChannelSidebarCategory(userID, teamID string, newCategory \*model.SidebarCategoryWithChannels) (\*model.SidebarCategoryWithChannels, \*model.AppError)  
   * GetChannelSidebarCategories(userID, teamID string) (\*model.OrderedSidebarCategories, \*model.AppError)  
   * UpdateChannelSidebarCategories(userID, teamID string, categories \[\]\*model.SidebarCategoryWithChannels) (\[\]\*model.SidebarCategoryWithChannels, \*model.AppError)
* Command  
   * RegisterCommand(command \*model.Command) error  
   * UnregisterCommand(teamID, trigger string) error  
   * ExecuteSlashCommand(commandArgs \*model.CommandArgs) (\*model.CommandResponse, error)
* Configuration  
   * GetConfig() \*model.Config  
   * GetUnsanitizedConfig() \*model.Config  
   * SaveConfig(config \*model.Config) \*model.AppError
* Emoji  
   * GetEmojiList(sortBy string, page, perPage int) (\[\]\*model.Emoji, \*model.AppError)  
   * GetEmojiByName(name string) (\*model.Emoji, \*model.AppError)  
   * GetEmoji(emojiId string) (\*model.Emoji, \*model.AppError)  
   * GetEmojiImage(emojiId string) (\[\]byte, string, \*model.AppError)
* File  
   * CopyFileInfos(userID string, fileIds \[\]string) (\[\]string, \*model.AppError)  
   * GetFileInfo(fileId string) (\*model.FileInfo, \*model.AppError)  
   * SetFileSearchableContent(fileID string, content string) \*model.AppError  
   * GetFileInfos(page, perPage int, opt \*model.GetFileInfosOptions) (\[\]\*model.FileInfo, \*model.AppError)  
   * GetFile(fileId string) (\[\]byte, \*model.AppError)  
   * GetFileLink(fileId string) (string, \*model.AppError)  
   * ReadFile(path string) (\[\]byte, \*model.AppError)  
   * UploadFile(data \[\]byte, channelId string, filename string) (\*model.FileInfo, \*model.AppError)
* Group  
   * GetGroup(groupId string) (\*model.Group, \*model.AppError)  
   * GetGroupByName(name string) (\*model.Group, \*model.AppError)  
   * GetGroupMemberUsers(groupID string, page, perPage int) (\[\]\*model.User, \*model.AppError)  
   * GetGroupsBySource(groupSource model.GroupSource) (\[\]\*model.Group, \*model.AppError)  
   * GetGroupsForUser(userID string) (\[\]\*model.Group, \*model.AppError)  
   * UpsertGroupMember(groupID string, userID string) (\*model.GroupMember, \*model.AppError)  
   * UpsertGroupMembers(groupID string, userIDs \[\]string) (\[\]\*model.GroupMember, \*model.AppError)  
   * GetGroupByRemoteID(remoteID string, groupSource model.GroupSource) (\*model.Group, \*model.AppError)  
   * CreateGroup(group \*model.Group) (\*model.Group, \*model.AppError)  
   * UpdateGroup(group \*model.Group) (\*model.Group, \*model.AppError)  
   * DeleteGroup(groupID string) (\*model.Group, \*model.AppError)  
   * RestoreGroup(groupID string) (\*model.Group, \*model.AppError)  
   * DeleteGroupMember(groupID string, userID string) (\*model.GroupMember, \*model.AppError)  
   * GetGroupSyncable(groupID string, syncableID string, syncableType model.GroupSyncableType) (\*model.GroupSyncable, \*model.AppError)  
   * GetGroupSyncables(groupID string, syncableType model.GroupSyncableType) (\[\]\*model.GroupSyncable, \*model.AppError)  
   * UpsertGroupSyncable(groupSyncable \*model.GroupSyncable) (\*model.GroupSyncable, \*model.AppError)  
   * UpdateGroupSyncable(groupSyncable \*model.GroupSyncable) (\*model.GroupSyncable, \*model.AppError)  
   * DeleteGroupSyncable(groupID string, syncableID string, syncableType model.GroupSyncableType) (\*model.GroupSyncable, \*model.AppError)  
   * GetGroups(page, perPage int, opts model.GroupSearchOpts, viewRestrictions \*model.ViewUsersRestrictions) (\[\]\*model.Group, \*model.AppError)  
   * CreateDefaultSyncableMemberships(params model.CreateDefaultMembershipParams) \*model.AppError  
   * DeleteGroupConstrainedMemberships() \*model.AppError
* KeyValueStore  
   * KVSet(key string, value \[\]byte) \*model.AppError  
   * KVCompareAndSet(key string, oldValue, newValue \[\]byte) (bool, \*model.AppError)  
   * KVCompareAndDelete(key string, oldValue \[\]byte) (bool, \*model.AppError)  
   * KVSetWithExpiry(key string, value \[\]byte, expireInSeconds int64) \*model.AppError  
   * KVGet(key string) (\[\]byte, \*model.AppError)  
   * KVDelete(key string) \*model.AppError  
   * KVDeleteAll() \*model.AppError  
   * KVList(page, perPage int) (\[\]string, \*model.AppError)
* Logging  
   * LogDebug(msg string, keyValuePairs ...any)  
   * LogInfo(msg string, keyValuePairs ...any)  
   * LogError(msg string, keyValuePairs ...any)  
   * LogWarn(msg string, keyValuePairs ...any)
* OAuth  
   * CreateOAuthApp(app \*model.OAuthApp) (\*model.OAuthApp, \*model.AppError)  
   * GetOAuthApp(appID string) (\*model.OAuthApp, \*model.AppError)  
   * UpdateOAuthApp(app \*model.OAuthApp) (\*model.OAuthApp, \*model.AppError)  
   * DeleteOAuthApp(appID string) \*model.AppError
* Plugin  
   * LoadPluginConfiguration(dest any) error  
   * GetPluginConfig() map\[string\]any  
   * SavePluginConfig(config map\[string\]any) \*model.AppError  
   * GetBundlePath() (string, error)  
   * GetPlugins() (\[\]\*model.Manifest, \*model.AppError)  
   * EnablePlugin(id string) \*model.AppError  
   * DisablePlugin(id string) \*model.AppError  
   * RemovePlugin(id string) \*model.AppError  
   * GetPluginStatus(id string) (\*model.PluginStatus, \*model.AppError)  
   * InstallPlugin(file io.Reader, replace bool) (\*model.Manifest, \*model.AppError)  
   * GetPluginID() string
* Post  
   * SearchPostsInTeam(teamID string, paramsList \[\]\*model.SearchParams) (\[\]\*model.Post, \*model.AppError)  
   * SearchPostsInTeamForUser(teamID string, userID string, searchParams model.SearchParameter) (\*model.PostSearchResults, \*model.AppError)  
   * CreatePost(post \*model.Post) (\*model.Post, \*model.AppError)  
   * AddReaction(reaction \*model.Reaction) (\*model.Reaction, \*model.AppError)  
   * RemoveReaction(reaction \*model.Reaction) \*model.AppError  
   * GetReactions(postId string) (\[\]\*model.Reaction, \*model.AppError)  
   * SendEphemeralPost(userID string, post \*model.Post) \*model.Post  
   * UpdateEphemeralPost(userID string, post \*model.Post) \*model.Post  
   * DeleteEphemeralPost(userID, postId string)  
   * DeletePost(postId string) \*model.AppError  
   * GetPostThread(postId string) (\*model.PostList, \*model.AppError)  
   * GetPost(postId string) (\*model.Post, \*model.AppError)  
   * GetPostsSince(channelId string, time int64) (\*model.PostList, \*model.AppError)  
   * GetPostsAfter(channelId, postId string, page, perPage int) (\*model.PostList, \*model.AppError)  
   * GetPostsBefore(channelId, postId string, page, perPage int) (\*model.PostList, \*model.AppError)  
   * GetPostsForChannel(channelId string, page, perPage int) (\*model.PostList, \*model.AppError)  
   * UpdatePost(post \*model.Post) (\*model.Post, \*model.AppError)
* Preference  
   * GetPreferenceForUser(userID, category, name string) (model.Preference, \*model.AppError)  
   * GetPreferencesForUser(userID string) (\[\]model.Preference, \*model.AppError)  
   * UpdatePreferencesForUser(userID string, preferences \[\]model.Preference) \*model.AppError  
   * DeletePreferencesForUser(userID string, preferences \[\]model.Preference) \*model.AppError
* PropertyField  
   * CreatePropertyField(field \*model.PropertyField) (\*model.PropertyField, error)  
   * GetPropertyField(groupID, fieldID string) (\*model.PropertyField, error)  
   * GetPropertyFields(groupID string, ids \[\]string) (\[\]\*model.PropertyField, error)  
   * UpdatePropertyField(groupID string, field \*model.PropertyField) (\*model.PropertyField, error)  
   * DeletePropertyField(groupID, fieldID string) error  
   * SearchPropertyFields(groupID, targetID string, opts model.PropertyFieldSearchOpts) (\[\]\*model.PropertyField, error)  
   * GetPropertyFieldByName(groupID, targetID, name string) (\*model.PropertyField, error)  
   * UpdatePropertyFields(groupID string, fields \[\]\*model.PropertyField) (\[\]\*model.PropertyField, error)
* PropertyGroup  
   * RegisterPropertyGroup(name string) (\*model.PropertyGroup, error)  
   * GetPropertyGroup(name string) (\*model.PropertyGroup, error)
* PropertyValue  
   * CreatePropertyValue(value \*model.PropertyValue) (\*model.PropertyValue, error)  
   * GetPropertyValue(groupID, valueID string) (\*model.PropertyValue, error)  
   * GetPropertyValues(groupID string, ids \[\]string) (\[\]\*model.PropertyValue, error)  
   * UpdatePropertyValue(groupID string, value \*model.PropertyValue) (\*model.PropertyValue, error)  
   * UpsertPropertyValue(value \*model.PropertyValue) (\*model.PropertyValue, error)  
   * DeletePropertyValue(groupID, valueID string) error  
   * SearchPropertyValues(groupID, targetID string, opts model.PropertyValueSearchOpts) (\[\]\*model.PropertyValue, error)  
   * UpdatePropertyValues(groupID string, values \[\]\*model.PropertyValue) (\[\]\*model.PropertyValue, error)  
   * UpsertPropertyValues(values \[\]\*model.PropertyValue) (\[\]\*model.PropertyValue, error)  
   * DeletePropertyValuesForTarget(groupID, targetType, targetID string) error  
   * DeletePropertyValuesForField(groupID, fieldID string) error
* Server  
   * GetLicense() \*model.License  
   * IsEnterpriseReady() bool  
   * GetServerVersion() string  
   * GetSystemInstallDate() (int64, \*model.AppError)  
   * GetDiagnosticId() string  
   * GetTelemetryId() string
* SharedChannels  
   * RegisterPluginForSharedChannels(opts model.RegisterPluginOpts) (remoteID string, err error)  
   * UnregisterPluginForSharedChannels(pluginID string) error  
   * ShareChannel(sc \*model.SharedChannel) (\*model.SharedChannel, error)  
   * UpdateSharedChannel(sc \*model.SharedChannel) (\*model.SharedChannel, error)  
   * UnshareChannel(channelID string) (unshared bool, err error)  
   * UpdateSharedChannelCursor(channelID, remoteID string, cusror model.GetPostsSinceForSyncCursor) error  
   * SyncSharedChannel(channelID string) error  
   * InviteRemoteToChannel(channelID string, remoteID string, userID string, shareIfNotShared bool) error  
   * UninviteRemoteFromChannel(channelID string, remoteID string) error
* SlashCommand  
   * CreateCommand(cmd \*model.Command) (\*model.Command, error)  
   * ListCommands(teamID string) (\[\]\*model.Command, error)  
   * ListCustomCommands(teamID string) (\[\]\*model.Command, error)  
   * ListPluginCommands(teamID string) (\[\]\*model.Command, error)  
   * ListBuiltInCommands() (\[\]\*model.Command, error)  
   * GetCommand(commandID string) (\*model.Command, error)  
   * UpdateCommand(commandID string, updatedCmd \*model.Command) (\*model.Command, error)  
   * DeleteCommand(commandID string) error
* Team  
   * GetUsersInTeam(teamID string, page int, perPage int) (\[\]\*model.User, \*model.AppError)  
   * GetTeamIcon(teamID string) (\[\]byte, \*model.AppError)  
   * SetTeamIcon(teamID string, data \[\]byte) \*model.AppError  
   * RemoveTeamIcon(teamID string) \*model.AppError  
   * CreateTeam(team \*model.Team) (\*model.Team, \*model.AppError)  
   * DeleteTeam(teamID string) \*model.AppError  
   * GetTeams() (\[\]\*model.Team, \*model.AppError)  
   * GetTeam(teamID string) (\*model.Team, \*model.AppError)  
   * GetTeamByName(name string) (\*model.Team, \*model.AppError)  
   * GetTeamsUnreadForUser(userID string) (\[\]\*model.TeamUnread, \*model.AppError)  
   * UpdateTeam(team \*model.Team) (\*model.Team, \*model.AppError)  
   * SearchTeams(term string) (\[\]\*model.Team, \*model.AppError)  
   * GetTeamsForUser(userID string) (\[\]\*model.Team, \*model.AppError)  
   * CreateTeamMember(teamID, userID string) (\*model.TeamMember, \*model.AppError)  
   * CreateTeamMembers(teamID string, userIds \[\]string, requestorId string) (\[\]\*model.TeamMember, \*model.AppError)  
   * CreateTeamMembersGracefully(teamID string, userIds \[\]string, requestorId string) (\[\]\*model.TeamMemberWithError, \*model.AppError)  
   * DeleteTeamMember(teamID, userID, requestorId string) \*model.AppError  
   * GetTeamMembers(teamID string, page, perPage int) (\[\]\*model.TeamMember, \*model.AppError)  
   * GetTeamMember(teamID, userID string) (\*model.TeamMember, \*model.AppError)  
   * GetTeamMembersForUser(userID string, page int, perPage int) (\[\]\*model.TeamMember, \*model.AppError)  
   * UpdateTeamMemberRoles(teamID, userID, newRoles string) (\*model.TeamMember, \*model.AppError)  
   * GetPublicChannelsForTeam(teamID string, page, perPage int) (\[\]\*model.Channel, \*model.AppError)  
   * GetChannelByNameForTeamName(teamName, channelName string, includeDeleted bool) (\*model.Channel, \*model.AppError)  
   * GetChannelsForTeamForUser(teamID, userID string, includeDeleted bool) (\[\]\*model.Channel, \*model.AppError)  
   * SearchPostsInTeam(teamID string, paramsList \[\]\*model.SearchParams) (\[\]\*model.Post, \*model.AppError)  
   * GetTeamStats(teamID string) (\*model.TeamStats, \*model.AppError)  
   * HasPermissionToTeam(userID, teamID string, permission \*model.Permission) bool  
   * UpdateUserRoles(userID, newRoles string) (\*model.User, \*model.AppError)
* Upload  
   * CreateUploadSession(us \*model.UploadSession) (\*model.UploadSession, error)  
   * UploadData(us \*model.UploadSession, rd io.Reader) (\*model.FileInfo, error)  
   * GetUploadSession(uploadID string) (\*model.UploadSession, error)
* User  
   * CreateUser(user \*model.User) (\*model.User, \*model.AppError)  
   * DeleteUser(userID string) \*model.AppError  
   * GetUsers(options \*model.UserGetOptions) (\[\]\*model.User, \*model.AppError)  
   * GetUsersByIds(userIDs \[\]string) (\[\]\*model.User, \*model.AppError)  
   * GetUser(userID string) (\*model.User, \*model.AppError)  
   * GetUserByEmail(email string) (\*model.User, \*model.AppError)  
   * GetUserByUsername(name string) (\*model.User, \*model.AppError)  
   * GetUsersByUsernames(usernames \[\]string) (\[\]\*model.User, \*model.AppError)  
   * GetUsersInTeam(teamID string, page int, perPage int) (\[\]\*model.User, \*model.AppError)  
   * GetPreferenceForUser(userID, category, name string) (model.Preference, \*model.AppError)  
   * GetPreferencesForUser(userID string) (\[\]model.Preference, \*model.AppError)  
   * UpdatePreferencesForUser(userID string, preferences \[\]model.Preference) \*model.AppError  
   * DeletePreferencesForUser(userID string, preferences \[\]model.Preference) \*model.AppError  
   * CreateSession(session \*model.Session) (\*model.Session, \*model.AppError)  
   * ExtendSessionExpiry(sessionID string, newExpiry int64) \*model.AppError  
   * RevokeSession(sessionID string) \*model.AppError  
   * CreateUserAccessToken(token \*model.UserAccessToken) (\*model.UserAccessToken, \*model.AppError)  
   * RevokeUserAccessToken(tokenID string) \*model.AppError  
   * UpdateUser(user \*model.User) (\*model.User, \*model.AppError)  
   * GetUserStatus(userID string) (\*model.Status, \*model.AppError)  
   * GetUserStatusesByIds(userIds \[\]string) (\[\]\*model.Status, \*model.AppError)  
   * UpdateUserStatus(userID, status string) (\*model.Status, \*model.AppError)  
   * SetUserStatusTimedDND(userId string, endtime int64) (\*model.Status, \*model.AppError)  
   * UpdateUserActive(userID string, active bool) \*model.AppError  
   * UpdateUserCustomStatus(userID string, customStatus \*model.CustomStatus) \*model.AppError  
   * RemoveUserCustomStatus(userID string) \*model.AppError  
   * GetUsersInChannel(channelID, sortBy string, page, perPage int) (\[\]\*model.User, \*model.AppError)  
   * GetLDAPUserAttributes(userID string, attributes \[\]string) (map\[string\]string, \*model.AppError)  
   * GetTeamsUnreadForUser(userID string) (\[\]\*model.TeamUnread, \*model.AppError)  
   * GetTeamsForUser(userID string) (\[\]\*model.Team, \*model.AppError)  
   * CreateTeamMember(teamID, userID string) (\*model.TeamMember, \*model.AppError)  
   * CreateTeamMembers(teamID string, userIds \[\]string, requestorId string) (\[\]\*model.TeamMember, \*model.AppError)  
   * CreateTeamMembersGracefully(teamID string, userIds \[\]string, requestorId string) (\[\]\*model.TeamMemberWithError, \*model.AppError)  
   * DeleteTeamMember(teamID, userID, requestorId string) \*model.AppError  
   * GetTeamMembers(teamID string, page, perPage int) (\[\]\*model.TeamMember, \*model.AppError)  
   * GetTeamMember(teamID, userID string) (\*model.TeamMember, \*model.AppError)  
   * GetTeamMembersForUser(userID string, page int, perPage int) (\[\]\*model.TeamMember, \*model.AppError)  
   * UpdateTeamMemberRoles(teamID, userID, newRoles string) (\*model.TeamMember, \*model.AppError)  
   * GetChannelsForTeamForUser(teamID, userID string, includeDeleted bool) (\[\]\*model.Channel, \*model.AppError)  
   * GetDirectChannel(userId1, userId2 string) (\*model.Channel, \*model.AppError)  
   * GetGroupChannel(userIds \[\]string) (\*model.Channel, \*model.AppError)  
   * SearchUsers(search \*model.UserSearch) (\[\]\*model.User, \*model.AppError)  
   * AddChannelMember(channelId, userID string) (\*model.ChannelMember, \*model.AppError)  
   * AddUserToChannel(channelId, userID, asUserId string) (\*model.ChannelMember, \*model.AppError)  
   * GetChannelMember(channelId, userID string) (\*model.ChannelMember, \*model.AppError)  
   * GetChannelMembers(channelId string, page, perPage int) (model.ChannelMembers, \*model.AppError)  
   * GetChannelMembersByIds(channelId string, userIds \[\]string) (model.ChannelMembers, \*model.AppError)  
   * GetChannelMembersForUser(teamID, userID string, page, perPage int) (\[\]\*model.ChannelMember, \*model.AppError)  
   * UpdateChannelMemberRoles(channelId, userID, newRoles string) (\*model.ChannelMember, \*model.AppError)  
   * UpdateChannelMemberNotifications(channelId, userID string, notifications map\[string\]string) (\*model.ChannelMember, \*model.AppError)  
   * PatchChannelMembersNotifications(members \[\]\*model.ChannelMemberIdentifier, notifyProps map\[string\]string) \*model.AppError  
   * GetGroupsForUser(userID string) (\[\]\*model.Group, \*model.AppError)  
   * DeleteChannelMember(channelId, userID string) \*model.AppError  
   * GetProfileImage(userID string) (\[\]byte, \*model.AppError)  
   * SetProfileImage(userID string, data \[\]byte) \*model.AppError  
   * CopyFileInfos(userID string, fileIds \[\]string) (\[\]string, \*model.AppError)  
   * HasPermissionTo(userID string, permission \*model.Permission) bool  
   * HasPermissionToTeam(userID, teamID string, permission \*model.Permission) bool  
   * HasPermissionToChannel(userID, channelId string, permission \*model.Permission) bool  
   * PublishUserTyping(userID, channelId, parentId string) \*model.AppError  
   * UpdateUserAuth(userID string, userAuth \*model.UserAuth) (\*model.UserAuth, \*model.AppError)  
   * UpsertGroupMember(groupID string, userID string) (\*model.GroupMember, \*model.AppError)  
   * UpsertGroupMembers(groupID string, userIDs \[\]string) (\[\]\*model.GroupMember, \*model.AppError)  
   * DeleteGroupMember(groupID string, userID string) (\*model.GroupMember, \*model.AppError)  
   * UpdateUserRoles(userID, newRoles string) (\*model.User, \*model.AppError)

## Hooks 

Hooks describes the methods a plugin may implement to automatically receive the corresponding event.

A plugin only need implement the hooks it cares about. The MattermostPlugin provides some default implementations for convenience but may be overridden.

* OnActivate() error
* Implemented() (\[\]string, error)
* OnDeactivate() error
* OnConfigurationChange() error
* ServeHTTP(c \*plugin.Context, w http.ResponseWriter, r \*http.Request)
* ExecuteCommand(c \*plugin.Context, args \*model.CommandArgs) (\*model.CommandResponse, \*model.AppError)
* UserHasBeenCreated(c \*plugin.Context, user \*model.User)
* UserWillLogIn(c \*plugin.Context, user \*model.User) string
* UserHasLoggedIn(c \*plugin.Context, user \*model.User)
* MessageWillBePosted(c \*plugin.Context, post \*model.Post) (\*model.Post, string)
* MessageWillBeUpdated(c \*plugin.Context, newPost, oldPost \*model.Post) (\*model.Post, string)
* MessageHasBeenPosted(c \*plugin.Context, post \*model.Post)
* MessageHasBeenUpdated(c \*plugin.Context, newPost, oldPost \*model.Post)
* MessagesWillBeConsumed(posts \[\]\*model.Post) \[\]\*model.Post
* MessageHasBeenDeleted(c \*plugin.Context, post \*model.Post)
* ChannelHasBeenCreated(c \*plugin.Context, channel \*model.Channel)
* UserHasJoinedChannel(c \*plugin.Context, channelMember \*model.ChannelMember, actor \*model.User)
* UserHasLeftChannel(c \*plugin.Context, channelMember \*model.ChannelMember, actor \*model.User)
* UserHasJoinedTeam(c \*plugin.Context, teamMember \*model.TeamMember, actor \*model.User)
* UserHasLeftTeam(c \*plugin.Context, teamMember \*model.TeamMember, actor \*model.User)
* FileWillBeUploaded(c \*plugin.Context, info \*model.FileInfo, file io.Reader, output io.Writer) (\*model.FileInfo, string)
* ReactionHasBeenAdded(c \*plugin.Context, reaction \*model.Reaction)
* ReactionHasBeenRemoved(c \*plugin.Context, reaction \*model.Reaction)
* OnPluginClusterEvent(c \*plugin.Context, ev model.PluginClusterEvent)
* OnWebSocketConnect(webConnID, userID string)
* OnWebSocketDisconnect(webConnID, userID string)
* WebSocketMessageHasBeenPosted(webConnID, userID string, req \*model.WebSocketRequest)
* RunDataRetention(nowTime, batchSize int64) (int64, error)
* OnInstall(c \*plugin.Context, event model.OnInstallEvent) error
* OnSendDailyTelemetry()
* OnCloudLimitsUpdated(limits \*model.ProductLimits)
* ConfigurationWillBeSaved(newCfg \*model.Config) (\*model.Config, error)
* NotificationWillBePushed(pushNotification \*model.PushNotification, userID string) (\*model.PushNotification, string)
* UserHasBeenDeactivated(c \*plugin.Context, user \*model.User)
* ServeMetrics(c \*plugin.Context, w http.ResponseWriter, r \*http.Request)
* OnSharedChannelsSyncMsg(msg \*model.SyncMsg, rc \*model.RemoteCluster) (model.SyncResponse, error)
* OnSharedChannelsPing(rc \*model.RemoteCluster) bool
* PreferencesHaveChanged(c \*plugin.Context, preferences \[\]model.Preference)
* OnSharedChannelsAttachmentSyncMsg(fi \*model.FileInfo, post \*model.Post, rc \*model.RemoteCluster) error
* OnSharedChannelsProfileImageSyncMsg(user \*model.User, rc \*model.RemoteCluster) error
* GenerateSupportData(c \*plugin.Context) (\[\]\*model.FileData, error)
* OnSAMLLogin(c \*plugin.Context, user \*model.User, assertion \*gosaml2.AssertionInfo) error

## Helpers 

## Examples

* HelloWorld
* HelpPlugin

---

## API

### (API) LoadPluginConfiguration 

```
LoadPluginConfiguration(dest any) error
```

LoadPluginConfiguration loads the plugin's configuration. dest should be a pointer to a struct that the configuration JSON can be unmarshalled to.

@tag Plugin Minimum server version: 5.2

### (API) RegisterCommand 

```
RegisterCommand(command *model.Command) error
```

RegisterCommand registers a custom slash command. When the command is triggered, your plugin can fulfill it via the ExecuteCommand hook.

@tag Command Minimum server version: 5.2

### (API) UnregisterCommand 

```
UnregisterCommand(teamID, trigger string) error
```

UnregisterCommand unregisters a command previously register via RegisterCommand.

@tag Command Minimum server version: 5.2

### (API) ExecuteSlashCommand 

```
ExecuteSlashCommand(commandArgs *model.CommandArgs) (*model.CommandResponse, error)
```

ExecuteSlashCommand executes a slash command with the given parameters.

@tag Command Minimum server version: 5.26

### (API) GetConfig 

```
GetConfig() *model.Config
```

GetConfig fetches the currently persisted config

@tag Configuration Minimum server version: 5.2

### (API) GetUnsanitizedConfig 

```
GetUnsanitizedConfig() *model.Config
```

GetUnsanitizedConfig fetches the currently persisted config without removing secrets.

@tag Configuration Minimum server version: 5.16

### (API) SaveConfig 

```
SaveConfig(config *model.Config) *model.AppError
```

SaveConfig sets the given config and persists the changes

@tag Configuration Minimum server version: 5.2

### (API) GetPluginConfig 

```
GetPluginConfig() map[string]any
```

GetPluginConfig fetches the currently persisted config of plugin

@tag Plugin Minimum server version: 5.6

### (API) SavePluginConfig 

```
SavePluginConfig(config map[string]any) *model.AppError
```

SavePluginConfig sets the given config for plugin and persists the changes

@tag Plugin Minimum server version: 5.6

### (API) GetBundlePath 

```
GetBundlePath() (string, error)
```

GetBundlePath returns the absolute path where the plugin's bundle was unpacked.

@tag Plugin Minimum server version: 5.10

### (API) GetLicense 

```
GetLicense() *model.License
```

GetLicense returns the current license used by the Mattermost server. Returns nil if the server does not have a license.

@tag Server Minimum server version: 5.10

### (API) IsEnterpriseReady 

```
IsEnterpriseReady() bool
```

IsEnterpriseReady returns true if the Mattermost server is configured as Enterprise Ready.

@tag Server Minimum server version: 5.10

### (API) GetServerVersion 

```
GetServerVersion() string
```

GetServerVersion return the current Mattermost server version

@tag Server Minimum server version: 5.4

### (API) GetSystemInstallDate 

```
GetSystemInstallDate() (int64, *model.AppError)
```

GetSystemInstallDate returns the time that Mattermost was first installed and ran.

@tag Server Minimum server version: 5.10

### (API) GetDiagnosticId 

```
GetDiagnosticId() string
```

GetDiagnosticId returns a unique identifier used by the server for diagnostic reports.

@tag Server Minimum server version: 5.10

### (API) GetTelemetryId 

```
GetTelemetryId() string
```

GetTelemetryId returns a unique identifier used by the server for telemetry reports.

@tag Server Minimum server version: 5.28

### (API) CreateUser 

```
CreateUser(user *model.User) (*model.User, *model.AppError)
```

CreateUser creates a user.

@tag User Minimum server version: 5.2

### (API) DeleteUser 

```
DeleteUser(userID string) *model.AppError
```

DeleteUser deletes a user.

@tag User Minimum server version: 5.2

### (API) GetUsers 

```
GetUsers(options *model.UserGetOptions) ([]*model.User, *model.AppError)
```

GetUsers a list of users based on search options.

Not all fields in UserGetOptions are supported by this API.

@tag User Minimum server version: 5.10

### (API) GetUsersByIds 

```
GetUsersByIds(userIDs []string) ([]*model.User, *model.AppError)
```

GetUsersByIds gets a list of users by their IDs.

@tag User Minimum server version: 9.8

### (API) GetUser 

```
GetUser(userID string) (*model.User, *model.AppError)
```

GetUser gets a user.

@tag User Minimum server version: 5.2

### (API) GetUserByEmail 

```
GetUserByEmail(email string) (*model.User, *model.AppError)
```

GetUserByEmail gets a user by their email address.

@tag User Minimum server version: 5.2

### (API) GetUserByUsername 

```
GetUserByUsername(name string) (*model.User, *model.AppError)
```

GetUserByUsername gets a user by their username.

@tag User Minimum server version: 5.2

### (API) GetUsersByUsernames 

```
GetUsersByUsernames(usernames []string) ([]*model.User, *model.AppError)
```

GetUsersByUsernames gets users by their usernames.

@tag User Minimum server version: 5.6

### (API) GetUsersInTeam 

```
GetUsersInTeam(teamID string, page int, perPage int) ([]*model.User, *model.AppError)
```

GetUsersInTeam gets users in team.

@tag User @tag Team Minimum server version: 5.6

### (API) GetPreferenceForUser 

```
GetPreferenceForUser(userID, category, name string) (model.Preference, *model.AppError)
```

GetPreferenceForUser gets a single preference for a user. An error is returned if the user has no preference set with the given category and name, an error is returned.

@tag User @tag Preference Minimum server version: 9.5

### (API) GetPreferencesForUser 

```
GetPreferencesForUser(userID string) ([]model.Preference, *model.AppError)
```

GetPreferencesForUser gets a user's preferences.

@tag User @tag Preference Minimum server version: 5.26

### (API) UpdatePreferencesForUser 

```
UpdatePreferencesForUser(userID string, preferences []model.Preference) *model.AppError
```

UpdatePreferencesForUser updates a user's preferences.

@tag User @tag Preference Minimum server version: 5.26

### (API) DeletePreferencesForUser 

```
DeletePreferencesForUser(userID string, preferences []model.Preference) *model.AppError
```

DeletePreferencesForUser deletes a user's preferences.

@tag User @tag Preference Minimum server version: 5.26

### (API) GetSession 

```
GetSession(sessionID string) (*model.Session, *model.AppError)
```

GetSession returns the session object for the Session ID

Minimum server version: 5.2

### (API) CreateSession 

```
CreateSession(session *model.Session) (*model.Session, *model.AppError)
```

CreateSession creates a new user session.

@tag User Minimum server version: 6.2

### (API) ExtendSessionExpiry 

```
ExtendSessionExpiry(sessionID string, newExpiry int64) *model.AppError
```

ExtendSessionExpiry extends the duration of an existing session.

@tag User Minimum server version: 6.2

### (API) RevokeSession 

```
RevokeSession(sessionID string) *model.AppError
```

RevokeSession revokes an existing user session.

@tag User Minimum server version: 6.2

### (API) CreateUserAccessToken 

```
CreateUserAccessToken(token *model.UserAccessToken) (*model.UserAccessToken, *model.AppError)
```

CreateUserAccessToken creates a new access token. @tag User Minimum server version: 5.38

### (API) RevokeUserAccessToken 

```
RevokeUserAccessToken(tokenID string) *model.AppError
```

RevokeUserAccessToken revokes an existing access token. @tag User Minimum server version: 5.38

### (API) GetTeamIcon 

```
GetTeamIcon(teamID string) ([]byte, *model.AppError)
```

GetTeamIcon gets the team icon.

@tag Team Minimum server version: 5.6

### (API) SetTeamIcon 

```
SetTeamIcon(teamID string, data []byte) *model.AppError
```

SetTeamIcon sets the team icon.

@tag Team Minimum server version: 5.6

### (API) RemoveTeamIcon 

```
RemoveTeamIcon(teamID string) *model.AppError
```

RemoveTeamIcon removes the team icon.

@tag Team Minimum server version: 5.6

### (API) UpdateUser 

```
UpdateUser(user *model.User) (*model.User, *model.AppError)
```

UpdateUser updates a user.

@tag User Minimum server version: 5.2

### (API) GetUserStatus 

```
GetUserStatus(userID string) (*model.Status, *model.AppError)
```

GetUserStatus will get a user's status.

@tag User Minimum server version: 5.2

### (API) GetUserStatusesByIds 

```
GetUserStatusesByIds(userIds []string) ([]*model.Status, *model.AppError)
```

GetUserStatusesByIds will return a list of user statuses based on the provided slice of user IDs.

@tag User Minimum server version: 5.2

### (API) UpdateUserStatus 

```
UpdateUserStatus(userID, status string) (*model.Status, *model.AppError)
```

UpdateUserStatus will set a user's status until the user, or another integration/plugin, sets it back to online. The status parameter can be: "online", "away", "dnd", or "offline".

@tag User Minimum server version: 5.2

### (API) SetUserStatusTimedDND 

```
SetUserStatusTimedDND(userId string, endtime int64) (*model.Status, *model.AppError)
```

SetUserStatusTimedDND will set a user's status to dnd for given time until the user, or another integration/plugin, sets it back to online. @tag User Minimum server version: 5.35

### (API) UpdateUserActive 

```
UpdateUserActive(userID string, active bool) *model.AppError
```

UpdateUserActive deactivates or reactivates an user.

@tag User Minimum server version: 5.8

### (API) UpdateUserCustomStatus 

```
UpdateUserCustomStatus(userID string, customStatus *model.CustomStatus) *model.AppError
```

UpdateUserCustomStatus will set a user's custom status until the user, or another integration/plugin, clear it or update the custom status. The custom status have two parameters: emoji icon and custom text.

@tag User Minimum server version: 6.2

### (API) RemoveUserCustomStatus 

```
RemoveUserCustomStatus(userID string) *model.AppError
```

RemoveUserCustomStatus will remove a user's custom status.

@tag User Minimum server version: 6.2

### (API) GetUsersInChannel 

```
GetUsersInChannel(channelID, sortBy string, page, perPage int) ([]*model.User, *model.AppError)
```

GetUsersInChannel returns a page of users in a channel. Page counting starts at 0\. The sortBy parameter can be: "username" or "status".

@tag User @tag Channel Minimum server version: 5.6

### (API) GetLDAPUserAttributes 

```
GetLDAPUserAttributes(userID string, attributes []string) (map[string]string, *model.AppError)
```

GetLDAPUserAttributes will return LDAP attributes for a user. The attributes parameter should be a list of attributes to pull. Returns a map with attribute names as keys and the user's attributes as values. Requires an enterprise license, LDAP to be configured and for the user to use LDAP as an authentication method.

@tag User Minimum server version: 5.3

### (API) CreateTeam 

```
CreateTeam(team *model.Team) (*model.Team, *model.AppError)
```

CreateTeam creates a team.

@tag Team Minimum server version: 5.2

### (API) DeleteTeam 

```
DeleteTeam(teamID string) *model.AppError
```

DeleteTeam deletes a team.

@tag Team Minimum server version: 5.2

### (API) GetTeams 

```
GetTeams() ([]*model.Team, *model.AppError)
```

GetTeam gets all teams.

@tag Team Minimum server version: 5.2

### (API) GetTeam 

```
GetTeam(teamID string) (*model.Team, *model.AppError)
```

GetTeam gets a team.

@tag Team Minimum server version: 5.2

### (API) GetTeamByName 

```
GetTeamByName(name string) (*model.Team, *model.AppError)
```

GetTeamByName gets a team by its name.

@tag Team Minimum server version: 5.2

### (API) GetTeamsUnreadForUser 

```
GetTeamsUnreadForUser(userID string) ([]*model.TeamUnread, *model.AppError)
```

GetTeamsUnreadForUser gets the unread message and mention counts for each team to which the given user belongs.

@tag Team @tag User Minimum server version: 5.6

### (API) UpdateTeam 

```
UpdateTeam(team *model.Team) (*model.Team, *model.AppError)
```

UpdateTeam updates a team.

@tag Team Minimum server version: 5.2

### (API) SearchTeams 

```
SearchTeams(term string) ([]*model.Team, *model.AppError)
```

SearchTeams search a team.

@tag Team Minimum server version: 5.8

### (API) GetTeamsForUser 

```
GetTeamsForUser(userID string) ([]*model.Team, *model.AppError)
```

GetTeamsForUser returns list of teams of given user ID.

@tag Team @tag User Minimum server version: 5.6

### (API) CreateTeamMember 

```
CreateTeamMember(teamID, userID string) (*model.TeamMember, *model.AppError)
```

CreateTeamMember creates a team membership.

@tag Team @tag User Minimum server version: 5.2

### (API) CreateTeamMembers 

```
CreateTeamMembers(teamID string, userIds []string, requestorId string) ([]*model.TeamMember, *model.AppError)
```

CreateTeamMembers creates a team membership for all provided user ids.

@tag Team @tag User Minimum server version: 5.2

### (API) CreateTeamMembersGracefully 

```
CreateTeamMembersGracefully(teamID string, userIds []string, requestorId string) ([]*model.TeamMemberWithError, *model.AppError)
```

CreateTeamMembersGracefully creates a team membership for all provided user ids and reports the users that were not added.

@tag Team @tag User Minimum server version: 5.20

### (API) DeleteTeamMember 

```
DeleteTeamMember(teamID, userID, requestorId string) *model.AppError
```

DeleteTeamMember deletes a team membership.

@tag Team @tag User Minimum server version: 5.2

### (API) GetTeamMembers 

```
GetTeamMembers(teamID string, page, perPage int) ([]*model.TeamMember, *model.AppError)
```

GetTeamMembers returns the memberships of a specific team.

@tag Team @tag User Minimum server version: 5.2

### (API) GetTeamMember 

```
GetTeamMember(teamID, userID string) (*model.TeamMember, *model.AppError)
```

GetTeamMember returns a specific membership.

@tag Team @tag User Minimum server version: 5.2

### (API) GetTeamMembersForUser 

```
GetTeamMembersForUser(userID string, page int, perPage int) ([]*model.TeamMember, *model.AppError)
```

GetTeamMembersForUser returns all team memberships for a user.

@tag Team @tag User Minimum server version: 5.10

### (API) UpdateTeamMemberRoles 

```
UpdateTeamMemberRoles(teamID, userID, newRoles string) (*model.TeamMember, *model.AppError)
```

UpdateTeamMemberRoles updates the role for a team membership.

@tag Team @tag User Minimum server version: 5.2

### (API) CreateChannel 

```
CreateChannel(channel *model.Channel) (*model.Channel, *model.AppError)
```

CreateChannel creates a channel.

@tag Channel Minimum server version: 5.2

### (API) DeleteChannel 

```
DeleteChannel(channelId string) *model.AppError
```

DeleteChannel deletes a channel.

@tag Channel Minimum server version: 5.2

### (API) GetPublicChannelsForTeam 

```
GetPublicChannelsForTeam(teamID string, page, perPage int) ([]*model.Channel, *model.AppError)
```

GetPublicChannelsForTeam gets a list of all channels.

@tag Channel @tag Team Minimum server version: 5.2

### (API) GetChannel 

```
GetChannel(channelId string) (*model.Channel, *model.AppError)
```

GetChannel gets a channel.

@tag Channel Minimum server version: 5.2

### (API) GetChannelByName 

```
GetChannelByName(teamID, name string, includeDeleted bool) (*model.Channel, *model.AppError)
```

GetChannelByName gets a channel by its name, given a team id.

@tag Channel Minimum server version: 5.2

### (API) GetChannelByNameForTeamName 

```
GetChannelByNameForTeamName(teamName, channelName string, includeDeleted bool) (*model.Channel, *model.AppError)
```

GetChannelByNameForTeamName gets a channel by its name, given a team name.

@tag Channel @tag Team Minimum server version: 5.2

### (API) GetChannelsForTeamForUser 

```
GetChannelsForTeamForUser(teamID, userID string, includeDeleted bool) ([]*model.Channel, *model.AppError)
```

GetChannelsForTeamForUser gets a list of channels for given user ID in given team ID, including DMs. If an empty string is passed as the team ID, the user's channels on all teams and their DMs will be returned.

@tag Channel @tag Team @tag User Minimum server version: 5.6

### (API) GetChannelStats 

```
GetChannelStats(channelId string) (*model.ChannelStats, *model.AppError)
```

GetChannelStats gets statistics for a channel.

@tag Channel Minimum server version: 5.6

### (API) GetDirectChannel 

```
GetDirectChannel(userId1, userId2 string) (*model.Channel, *model.AppError)
```

GetDirectChannel gets a direct message channel. If the channel does not exist it will create it.

@tag Channel @tag User Minimum server version: 5.2

### (API) GetGroupChannel 

```
GetGroupChannel(userIds []string) (*model.Channel, *model.AppError)
```

GetGroupChannel gets a group message channel. If the channel does not exist it will create it.

@tag Channel @tag User Minimum server version: 5.2

### (API) UpdateChannel 

```
UpdateChannel(channel *model.Channel) (*model.Channel, *model.AppError)
```

UpdateChannel updates a channel.

@tag Channel Minimum server version: 5.2

### (API) SearchChannels 

```
SearchChannels(teamID string, term string) ([]*model.Channel, *model.AppError)
```

SearchChannels returns the channels on a team matching the provided search term.

@tag Channel Minimum server version: 5.6

### (API) CreateChannelSidebarCategory 

```
CreateChannelSidebarCategory(userID, teamID string, newCategory *model.SidebarCategoryWithChannels) (*model.SidebarCategoryWithChannels, *model.AppError)
```

CreateChannelSidebarCategory creates a new sidebar category for a set of channels.

@tag ChannelSidebar Minimum server version: 5.38

### (API) GetChannelSidebarCategories 

```
GetChannelSidebarCategories(userID, teamID string) (*model.OrderedSidebarCategories, *model.AppError)
```

GetChannelSidebarCategories returns sidebar categories.

@tag ChannelSidebar Minimum server version: 5.38

### (API) UpdateChannelSidebarCategories 

```
UpdateChannelSidebarCategories(userID, teamID string, categories []*model.SidebarCategoryWithChannels) ([]*model.SidebarCategoryWithChannels, *model.AppError)
```

UpdateChannelSidebarCategories updates the channel sidebar categories.

@tag ChannelSidebar Minimum server version: 5.38

### (API) SearchUsers 

```
SearchUsers(search *model.UserSearch) ([]*model.User, *model.AppError)
```

SearchUsers returns a list of users based on some search criteria.

@tag User Minimum server version: 5.6

### (API) SearchPostsInTeam 

```
SearchPostsInTeam(teamID string, paramsList []*model.SearchParams) ([]*model.Post, *model.AppError)
```

SearchPostsInTeam returns a list of posts in a specific team that match the given params.

@tag Post @tag Team Minimum server version: 5.10

### (API) SearchPostsInTeamForUser 

```
SearchPostsInTeamForUser(teamID string, userID string, searchParams model.SearchParameter) (*model.PostSearchResults, *model.AppError)
```

SearchPostsInTeamForUser returns a list of posts by team and user that match the given search parameters. @tag Post Minimum server version: 5.26

### (API) AddChannelMember 

```
AddChannelMember(channelId, userID string) (*model.ChannelMember, *model.AppError)
```

AddChannelMember joins a user to a channel (as if they joined themselves) This means the user will not receive notifications for joining the channel.

@tag Channel @tag User Minimum server version: 5.2

### (API) AddUserToChannel 

```
AddUserToChannel(channelId, userID, asUserId string) (*model.ChannelMember, *model.AppError)
```

AddUserToChannel adds a user to a channel as if the specified user had invited them. This means the user will receive the regular notifications for being added to the channel.

@tag User @tag Channel Minimum server version: 5.18

### (API) GetChannelMember 

```
GetChannelMember(channelId, userID string) (*model.ChannelMember, *model.AppError)
```

GetChannelMember gets a channel membership for a user.

@tag Channel @tag User Minimum server version: 5.2

### (API) GetChannelMembers 

```
GetChannelMembers(channelId string, page, perPage int) (model.ChannelMembers, *model.AppError)
```

GetChannelMembers gets a channel membership for all users.

@tag Channel @tag User Minimum server version: 5.6

### (API) GetChannelMembersByIds 

```
GetChannelMembersByIds(channelId string, userIds []string) (model.ChannelMembers, *model.AppError)
```

GetChannelMembersByIds gets a channel membership for a particular User

@tag Channel @tag User Minimum server version: 5.6

### (API) GetChannelMembersForUser 

```
GetChannelMembersForUser(teamID, userID string, page, perPage int) ([]*model.ChannelMember, *model.AppError)
```

GetChannelMembersForUser returns all channel memberships on a team for a user.

@tag Channel @tag User Minimum server version: 5.10

### (API) UpdateChannelMemberRoles 

```
UpdateChannelMemberRoles(channelId, userID, newRoles string) (*model.ChannelMember, *model.AppError)
```

UpdateChannelMemberRoles updates a user's roles for a channel.

@tag Channel @tag User Minimum server version: 5.2

### (API) UpdateChannelMemberNotifications 

```
UpdateChannelMemberNotifications(channelId, userID string, notifications map[string]string) (*model.ChannelMember, *model.AppError)
```

UpdateChannelMemberNotifications updates a user's notification properties for a channel.

@tag Channel @tag User Minimum server version: 5.2

### (API) PatchChannelMembersNotifications 

```
PatchChannelMembersNotifications(members []*model.ChannelMemberIdentifier, notifyProps map[string]string) *model.AppError
```

PatchChannelMembersNotifications updates the notification properties for multiple channel members. Other changes made to the channel memberships will be ignored. A maximum of 200 members can be updated at once.

@tag Channel @tag User Minimum server version: 9.5

### (API) GetGroup 

```
GetGroup(groupId string) (*model.Group, *model.AppError)
```

GetGroup gets a group by ID.

@tag Group Minimum server version: 5.18

### (API) GetGroupByName 

```
GetGroupByName(name string) (*model.Group, *model.AppError)
```

GetGroupByName gets a group by name.

@tag Group Minimum server version: 5.18

### (API) GetGroupMemberUsers 

```
GetGroupMemberUsers(groupID string, page, perPage int) ([]*model.User, *model.AppError)
```

GetGroupMemberUsers gets a page of users belonging to the given group.

@tag Group Minimum server version: 5.35

### (API) GetGroupsBySource 

```
GetGroupsBySource(groupSource model.GroupSource) ([]*model.Group, *model.AppError)
```

GetGroupsBySource gets a list of all groups for the given source.

@tag Group Minimum server version: 5.35

### (API) GetGroupsForUser 

```
GetGroupsForUser(userID string) ([]*model.Group, *model.AppError)
```

GetGroupsForUser gets the groups a user is in.

@tag Group @tag User Minimum server version: 5.18

### (API) DeleteChannelMember 

```
DeleteChannelMember(channelId, userID string) *model.AppError
```

DeleteChannelMember deletes a channel membership for a user.

@tag Channel @tag User Minimum server version: 5.2

### (API) CreatePost 

```
CreatePost(post *model.Post) (*model.Post, *model.AppError)
```

CreatePost creates a post.

@tag Post Minimum server version: 5.2

### (API) AddReaction 

```
AddReaction(reaction *model.Reaction) (*model.Reaction, *model.AppError)
```

AddReaction add a reaction to a post.

@tag Post Minimum server version: 5.3

### (API) RemoveReaction 

```
RemoveReaction(reaction *model.Reaction) *model.AppError
```

RemoveReaction remove a reaction from a post.

@tag Post Minimum server version: 5.3

### (API) GetReactions 

```
GetReactions(postId string) ([]*model.Reaction, *model.AppError)
```

GetReaction get the reactions of a post.

@tag Post Minimum server version: 5.3

### (API) SendEphemeralPost 

```
SendEphemeralPost(userID string, post *model.Post) *model.Post
```

SendEphemeralPost creates an ephemeral post.

@tag Post Minimum server version: 5.2

### (API) UpdateEphemeralPost 

```
UpdateEphemeralPost(userID string, post *model.Post) *model.Post
```

UpdateEphemeralPost updates an ephemeral message previously sent to the user. EXPERIMENTAL: This API is experimental and can be changed without advance notice.

@tag Post Minimum server version: 5.2

### (API) DeleteEphemeralPost 

```
DeleteEphemeralPost(userID, postId string) 
```

DeleteEphemeralPost deletes an ephemeral message previously sent to the user. EXPERIMENTAL: This API is experimental and can be changed without advance notice.

@tag Post Minimum server version: 5.2

### (API) DeletePost 

```
DeletePost(postId string) *model.AppError
```

DeletePost deletes a post.

@tag Post Minimum server version: 5.2

### (API) GetPostThread 

```
GetPostThread(postId string) (*model.PostList, *model.AppError)
```

GetPostThread gets a post with all the other posts in the same thread.

@tag Post Minimum server version: 5.6

### (API) GetPost 

```
GetPost(postId string) (*model.Post, *model.AppError)
```

GetPost gets a post.

@tag Post Minimum server version: 5.2

### (API) GetPostsSince 

```
GetPostsSince(channelId string, time int64) (*model.PostList, *model.AppError)
```

GetPostsSince gets posts created after a specified time as Unix time in milliseconds.

@tag Post @tag Channel Minimum server version: 5.6

### (API) GetPostsAfter 

```
GetPostsAfter(channelId, postId string, page, perPage int) (*model.PostList, *model.AppError)
```

GetPostsAfter gets a page of posts that were posted after the post provided.

@tag Post @tag Channel Minimum server version: 5.6

### (API) GetPostsBefore 

```
GetPostsBefore(channelId, postId string, page, perPage int) (*model.PostList, *model.AppError)
```

GetPostsBefore gets a page of posts that were posted before the post provided.

@tag Post @tag Channel Minimum server version: 5.6

### (API) GetPostsForChannel 

```
GetPostsForChannel(channelId string, page, perPage int) (*model.PostList, *model.AppError)
```

GetPostsForChannel gets a list of posts for a channel.

@tag Post @tag Channel Minimum server version: 5.6

### (API) GetTeamStats 

```
GetTeamStats(teamID string) (*model.TeamStats, *model.AppError)
```

GetTeamStats gets a team's statistics

@tag Team Minimum server version: 5.8

### (API) UpdatePost 

```
UpdatePost(post *model.Post) (*model.Post, *model.AppError)
```

UpdatePost updates a post.

@tag Post Minimum server version: 5.2

### (API) GetProfileImage 

```
GetProfileImage(userID string) ([]byte, *model.AppError)
```

GetProfileImage gets user's profile image.

@tag User Minimum server version: 5.6

### (API) SetProfileImage 

```
SetProfileImage(userID string, data []byte) *model.AppError
```

SetProfileImage sets a user's profile image.

@tag User Minimum server version: 5.6

### (API) GetEmojiList 

```
GetEmojiList(sortBy string, page, perPage int) ([]*model.Emoji, *model.AppError)
```

GetEmojiList returns a page of custom emoji on the system.

The sortBy parameter can be: "name".

@tag Emoji Minimum server version: 5.6

### (API) GetEmojiByName 

```
GetEmojiByName(name string) (*model.Emoji, *model.AppError)
```

GetEmojiByName gets an emoji by it's name.

@tag Emoji Minimum server version: 5.6

### (API) GetEmoji 

```
GetEmoji(emojiId string) (*model.Emoji, *model.AppError)
```

GetEmoji returns a custom emoji based on the emojiId string.

@tag Emoji Minimum server version: 5.6

### (API) CopyFileInfos 

```
CopyFileInfos(userID string, fileIds []string) ([]string, *model.AppError)
```

CopyFileInfos duplicates the FileInfo objects referenced by the given file ids, recording the given user id as the new creator and returning the new set of file ids.

The duplicate FileInfo objects are not initially linked to a post, but may now be passed to CreatePost. Use this API to duplicate a post and its file attachments without actually duplicating the uploaded files.

@tag File @tag User Minimum server version: 5.2

### (API) GetFileInfo 

```
GetFileInfo(fileId string) (*model.FileInfo, *model.AppError)
```

GetFileInfo gets a File Info for a specific fileId

@tag File Minimum server version: 5.3

### (API) SetFileSearchableContent 

```
SetFileSearchableContent(fileID string, content string) *model.AppError
```

SetFileSearchableContent update the File Info searchable text for full text search

@tag File Minimum server version: 9.1

### (API) GetFileInfos 

```
GetFileInfos(page, perPage int, opt *model.GetFileInfosOptions) ([]*model.FileInfo, *model.AppError)
```

GetFileInfos gets File Infos with options

@tag File Minimum server version: 5.22

### (API) GetFile 

```
GetFile(fileId string) ([]byte, *model.AppError)
```

GetFile gets content of a file by it's ID

@tag File Minimum server version: 5.8

### (API) GetFileLink 

```
GetFileLink(fileId string) (string, *model.AppError)
```

GetFileLink gets the public link to a file by fileId.

@tag File Minimum server version: 5.6

### (API) ReadFile 

```
ReadFile(path string) ([]byte, *model.AppError)
```

ReadFile reads the file from the backend for a specific path

@tag File Minimum server version: 5.3

### (API) GetEmojiImage 

```
GetEmojiImage(emojiId string) ([]byte, string, *model.AppError)
```

GetEmojiImage returns the emoji image.

@tag Emoji Minimum server version: 5.6

### (API) UploadFile 

```
UploadFile(data []byte, channelId string, filename string) (*model.FileInfo, *model.AppError)
```

UploadFile will upload a file to a channel using a multipart request, to be later attached to a post.

@tag File @tag Channel Minimum server version: 5.6

### (API) OpenInteractiveDialog 

```
OpenInteractiveDialog(dialog model.OpenDialogRequest) *model.AppError
```

OpenInteractiveDialog will open an interactive dialog on a user's client that generated the trigger ID. Used with interactive message buttons, menus and slash commands.

Minimum server version: 5.6

### (API) GetPlugins 

```
GetPlugins() ([]*model.Manifest, *model.AppError)
```

GetPlugins will return a list of plugin manifests for currently active plugins.

@tag Plugin Minimum server version: 5.6

### (API) EnablePlugin 

```
EnablePlugin(id string) *model.AppError
```

EnablePlugin will enable an plugin installed.

@tag Plugin Minimum server version: 5.6

### (API) DisablePlugin 

```
DisablePlugin(id string) *model.AppError
```

DisablePlugin will disable an enabled plugin.

@tag Plugin Minimum server version: 5.6

### (API) RemovePlugin 

```
RemovePlugin(id string) *model.AppError
```

RemovePlugin will disable and delete a plugin.

@tag Plugin Minimum server version: 5.6

### (API) GetPluginStatus 

```
GetPluginStatus(id string) (*model.PluginStatus, *model.AppError)
```

GetPluginStatus will return the status of a plugin.

@tag Plugin Minimum server version: 5.6

### (API) InstallPlugin 

```
InstallPlugin(file io.Reader, replace bool) (*model.Manifest, *model.AppError)
```

InstallPlugin will upload another plugin with tar.gz file. Previous version will be replaced on replace true.

@tag Plugin Minimum server version: 5.18

### (API) KVSet 

```
KVSet(key string, value []byte) *model.AppError
```

KVSet stores a key-value pair, unique per plugin. Provided helper functions and internal plugin code will use the prefix \`mmi\_\` before keys. Do not use this prefix.

@tag KeyValueStore Minimum server version: 5.2

### (API) KVCompareAndSet 

```
KVCompareAndSet(key string, oldValue, newValue []byte) (bool, *model.AppError)
```

KVCompareAndSet updates a key-value pair, unique per plugin, but only if the current value matches the given oldValue. Inserts a new key if oldValue == nil. Returns (false, err) if DB error occurred Returns (false, nil) if current value != oldValue or key already exists when inserting Returns (true, nil) if current value == oldValue or new key is inserted

@tag KeyValueStore Minimum server version: 5.12

### (API) KVCompareAndDelete 

```
KVCompareAndDelete(key string, oldValue []byte) (bool, *model.AppError)
```

KVCompareAndDelete deletes a key-value pair, unique per plugin, but only if the current value matches the given oldValue. Returns (false, err) if DB error occurred Returns (false, nil) if current value != oldValue or key does not exist when deleting Returns (true, nil) if current value == oldValue and the key was deleted

@tag KeyValueStore Minimum server version: 5.16

### (API) KVSetWithOptions 

```
KVSetWithOptions(key string, value []byte, options model.PluginKVSetOptions) (bool, *model.AppError)
```

KVSetWithOptions stores a key-value pair, unique per plugin, according to the given options. Returns (false, err) if DB error occurred Returns (false, nil) if the value was not set Returns (true, nil) if the value was set

Minimum server version: 5.20

### (API) KVSetWithExpiry 

```
KVSetWithExpiry(key string, value []byte, expireInSeconds int64) *model.AppError
```

KVSet stores a key-value pair with an expiry time, unique per plugin.

@tag KeyValueStore Minimum server version: 5.6

### (API) KVGet 

```
KVGet(key string) ([]byte, *model.AppError)
```

KVGet retrieves a value based on the key, unique per plugin. Returns nil for non-existent keys.

@tag KeyValueStore Minimum server version: 5.2

### (API) KVDelete 

```
KVDelete(key string) *model.AppError
```

KVDelete removes a key-value pair, unique per plugin. Returns nil for non-existent keys.

@tag KeyValueStore Minimum server version: 5.2

### (API) KVDeleteAll 

```
KVDeleteAll() *model.AppError
```

KVDeleteAll removes all key-value pairs for a plugin.

@tag KeyValueStore Minimum server version: 5.6

### (API) KVList 

```
KVList(page, perPage int) ([]string, *model.AppError)
```

KVList lists all keys for a plugin.

@tag KeyValueStore Minimum server version: 5.6

### (API) PublishWebSocketEvent 

```
PublishWebSocketEvent(event string, payload map[string]any, broadcast *model.WebsocketBroadcast) 
```

PublishWebSocketEvent sends an event to WebSocket connections. event is the type and will be prepended with "custom\_<pluginid>\_". payload is the data sent with the event. Interface values must be primitive Go types or mattermost-server/model types. broadcast determines to which users to send the event.

Minimum server version: 5.2

### (API) HasPermissionTo 

```
HasPermissionTo(userID string, permission *model.Permission) bool
```

HasPermissionTo check if the user has the permission at system scope.

@tag User Minimum server version: 5.3

### (API) HasPermissionToTeam 

```
HasPermissionToTeam(userID, teamID string, permission *model.Permission) bool
```

HasPermissionToTeam check if the user has the permission at team scope.

@tag User @tag Team Minimum server version: 5.3

### (API) HasPermissionToChannel 

```
HasPermissionToChannel(userID, channelId string, permission *model.Permission) bool
```

HasPermissionToChannel check if the user has the permission at channel scope.

@tag User @tag Channel Minimum server version: 5.3

### (API) RolesGrantPermission 

```
RolesGrantPermission(roleNames []string, permissionId string) bool
```

RolesGrantPermission check if the specified roles grant the specified permission

Minimum server version: 6.3

### (API) LogDebug 

```
LogDebug(msg string, keyValuePairs ...any) 
```

LogDebug writes a log message to the Mattermost server log file. Appropriate context such as the plugin name will already be added as fields so plugins do not need to add that info.

@tag Logging Minimum server version: 5.2

### (API) LogInfo 

```
LogInfo(msg string, keyValuePairs ...any) 
```

LogInfo writes a log message to the Mattermost server log file. Appropriate context such as the plugin name will already be added as fields so plugins do not need to add that info.

@tag Logging Minimum server version: 5.2

### (API) LogError 

```
LogError(msg string, keyValuePairs ...any) 
```

LogError writes a log message to the Mattermost server log file. Appropriate context such as the plugin name will already be added as fields so plugins do not need to add that info.

@tag Logging Minimum server version: 5.2

### (API) LogWarn 

```
LogWarn(msg string, keyValuePairs ...any) 
```

LogWarn writes a log message to the Mattermost server log file. Appropriate context such as the plugin name will already be added as fields so plugins do not need to add that info.

@tag Logging Minimum server version: 5.2

### (API) SendMail 

```
SendMail(to, subject, htmlBody string) *model.AppError
```

SendMail sends an email to a specific address

Minimum server version: 5.7

### (API) CreateBot 

```
CreateBot(bot *model.Bot) (*model.Bot, *model.AppError)
```

CreateBot creates the given bot and corresponding user.

@tag Bot Minimum server version: 5.10

### (API) PatchBot 

```
PatchBot(botUserId string, botPatch *model.BotPatch) (*model.Bot, *model.AppError)
```

PatchBot applies the given patch to the bot and corresponding user.

@tag Bot Minimum server version: 5.10

### (API) GetBot 

```
GetBot(botUserId string, includeDeleted bool) (*model.Bot, *model.AppError)
```

GetBot returns the given bot.

@tag Bot Minimum server version: 5.10

### (API) GetBots 

```
GetBots(options *model.BotGetOptions) ([]*model.Bot, *model.AppError)
```

GetBots returns the requested page of bots.

@tag Bot Minimum server version: 5.10

### (API) UpdateBotActive 

```
UpdateBotActive(botUserId string, active bool) (*model.Bot, *model.AppError)
```

UpdateBotActive marks a bot as active or inactive, along with its corresponding user.

@tag Bot Minimum server version: 5.10

### (API) PermanentDeleteBot 

```
PermanentDeleteBot(botUserId string) *model.AppError
```

PermanentDeleteBot permanently deletes a bot and its corresponding user.

@tag Bot Minimum server version: 5.10

### (API) PluginHTTP 

```
PluginHTTP(request *http.Request) *http.Response
```

PluginHTTP allows inter-plugin requests to plugin APIs.

Minimum server version: 5.18

### (API) PublishUserTyping 

```
PublishUserTyping(userID, channelId, parentId string) *model.AppError
```

PublishUserTyping publishes a user is typing WebSocket event. The parentId parameter may be an empty string, the other parameters are required.

@tag User Minimum server version: 5.26

### (API) CreateCommand 

```
CreateCommand(cmd *model.Command) (*model.Command, error)
```

CreateCommand creates a server-owned slash command that is not handled by the plugin itself, and which will persist past the life of the plugin. The command will have its CreatorId set to "" and its PluginId set to the id of the plugin that created it.

@tag SlashCommand Minimum server version: 5.28

### (API) ListCommands 

```
ListCommands(teamID string) ([]*model.Command, error)
```

ListCommands returns the list of all slash commands for teamID. E.g., custom commands (those created through the integrations menu, the REST api, or the plugin api CreateCommand), plugin commands (those created with plugin api RegisterCommand), and builtin commands (those added internally through RegisterCommandProvider).

@tag SlashCommand Minimum server version: 5.28

### (API) ListCustomCommands 

```
ListCustomCommands(teamID string) ([]*model.Command, error)
```

ListCustomCommands returns the list of slash commands for teamID that where created through the integrations menu, the REST api, or the plugin api CreateCommand.

@tag SlashCommand Minimum server version: 5.28

### (API) ListPluginCommands 

```
ListPluginCommands(teamID string) ([]*model.Command, error)
```

ListPluginCommands returns the list of slash commands for teamID that were created with the plugin api RegisterCommand.

@tag SlashCommand Minimum server version: 5.28

### (API) ListBuiltInCommands 

```
ListBuiltInCommands() ([]*model.Command, error)
```

ListBuiltInCommands returns the list of slash commands that are builtin commands (those added internally through RegisterCommandProvider).

@tag SlashCommand Minimum server version: 5.28

### (API) GetCommand 

```
GetCommand(commandID string) (*model.Command, error)
```

GetCommand returns the command definition based on a command id string.

@tag SlashCommand Minimum server version: 5.28

### (API) UpdateCommand 

```
UpdateCommand(commandID string, updatedCmd *model.Command) (*model.Command, error)
```

UpdateCommand updates a single command (commandID) with the information provided in the updatedCmd model.Command struct. The following fields in the command cannot be updated: Id, Token, CreateAt, DeleteAt, and PluginId. If updatedCmd.TeamId is blank, it will be set to commandID's TeamId.

@tag SlashCommand Minimum server version: 5.28

### (API) DeleteCommand 

```
DeleteCommand(commandID string) error
```

DeleteCommand deletes a slash command (commandID).

@tag SlashCommand Minimum server version: 5.28

### (API) CreateOAuthApp 

```
CreateOAuthApp(app *model.OAuthApp) (*model.OAuthApp, *model.AppError)
```

CreateOAuthApp creates a new OAuth App.

@tag OAuth Minimum server version: 5.38

### (API) GetOAuthApp 

```
GetOAuthApp(appID string) (*model.OAuthApp, *model.AppError)
```

GetOAuthApp gets an existing OAuth App by id.

@tag OAuth Minimum server version: 5.38

### (API) UpdateOAuthApp 

```
UpdateOAuthApp(app *model.OAuthApp) (*model.OAuthApp, *model.AppError)
```

UpdateOAuthApp updates an existing OAuth App.

@tag OAuth Minimum server version: 5.38

### (API) DeleteOAuthApp 

```
DeleteOAuthApp(appID string) *model.AppError
```

DeleteOAuthApp deletes an existing OAuth App by id.

@tag OAuth Minimum server version: 5.38

### (API) PublishPluginClusterEvent 

```
PublishPluginClusterEvent(ev model.PluginClusterEvent, opts model.PluginClusterEventSendOptions) error
```

PublishPluginClusterEvent broadcasts a plugin event to all other running instances of the calling plugin that are present in the cluster.

This method is used to allow plugin communication in a High-Availability cluster. The receiving side should implement the OnPluginClusterEvent hook to receive events sent through this method.

Minimum server version: 5.36

### (API) RequestTrialLicense 

```
RequestTrialLicense(requesterID string, users int, termsAccepted bool, receiveEmailsAccepted bool) *model.AppError
```

RequestTrialLicense requests a trial license and installs it in the server

Minimum server version: 5.36

### (API) GetCloudLimits 

```
GetCloudLimits() (*model.ProductLimits, error)
```

GetCloudLimits gets limits associated with a cloud workspace, if any

Minimum server version: 7.0

### (API) EnsureBotUser 

```
EnsureBotUser(bot *model.Bot) (string, error)
```

EnsureBotUser updates the bot if it exists, otherwise creates it.

Minimum server version: 7.1

### (API) RegisterCollectionAndTopic 

```
RegisterCollectionAndTopic(collectionType, topicType string) error
```

RegisterCollectionAndTopic is no longer supported.

Minimum server version: 7.6

### (API) CreateUploadSession 

```
CreateUploadSession(us *model.UploadSession) (*model.UploadSession, error)
```

CreateUploadSession creates and returns a new (resumable) upload session.

@tag Upload Minimum server version: 7.6

### (API) UploadData 

```
UploadData(us *model.UploadSession, rd io.Reader) (*model.FileInfo, error)
```

UploadData uploads the data for a given upload session.

@tag Upload Minimum server version: 7.6

### (API) GetUploadSession 

```
GetUploadSession(uploadID string) (*model.UploadSession, error)
```

GetUploadSession returns the upload session for the provided id.

@tag Upload Minimum server version: 7.6

### (API) SendPushNotification 

```
SendPushNotification(notification *model.PushNotification, userID string) *model.AppError
```

SendPushNotification will send a push notification to all of user's sessions.

It is the responsibility of the plugin to respect the server's configuration and licence, especially related to \`cfg.EmailSettings.PushNotificationContents\`, particularly \`model.IdLoadedNotification\` and the generic settings. Refer to \`app.sendPushNotificationSync\` for the logic used to construct push notifications.

Note: the NotificationWillBePushed hook will be run after SendPushNotification is called.

Minimum server version: 9.0

### (API) UpdateUserAuth 

```
UpdateUserAuth(userID string, userAuth *model.UserAuth) (*model.UserAuth, *model.AppError)
```

UpdateUserAuth updates a user's auth data.

It is not currently possible to use this to set a user's auth to e-mail with a hashed password. It is meant to be used exclusively in setting a non-email auth service.

@tag User Minimum server version: 9.3

### (API) RegisterPluginForSharedChannels 

```
RegisterPluginForSharedChannels(opts model.RegisterPluginOpts) (remoteID string, err error)
```

RegisterPluginForSharedChannels registers the plugin as a \`Remote\` for SharedChannels. The plugin will receive synchronization messages via the \`OnSharedChannelsSyncMsg\` hook. This API is idempotent - when called repeatedly with the same \`RegisterPluginOpts.PluginID\` it will return the same remoteID.

@tag SharedChannels Minimum server version: 9.5

### (API) UnregisterPluginForSharedChannels 

```
UnregisterPluginForSharedChannels(pluginID string) error
```

UnregisterPluginForSharedChannels unregisters the plugin as a \`Remote\` for SharedChannels. The plugin will no longer receive synchronization messages via the \`OnSharedChannelsSyncMsg\` hook.

@tag SharedChannels Minimum server version: 9.5

### (API) ShareChannel 

```
ShareChannel(sc *model.SharedChannel) (*model.SharedChannel, error)
```

ShareChannel marks a channel for sharing via shared channels. Note, this does not automatically invite any remote clusters to the channel - use \`InviteRemote\` to invite a remote , or this plugin, to the shared channel and start synchronization.

@tag SharedChannels Minimum server version: 9.5

### (API) UpdateSharedChannel 

```
UpdateSharedChannel(sc *model.SharedChannel) (*model.SharedChannel, error)
```

UpdateSharedChannel updates a shared channel. This can be used to change the share name, display name, purpose, header, etc.

@tag SharedChannels Minimum server version: 9.5

### (API) UnshareChannel 

```
UnshareChannel(channelID string) (unshared bool, err error)
```

UnshareChannel unmarks a channel for sharing. The channel will no longer be shared and all remotes will be uninvited to the channel.

@tag SharedChannels Minimum server version: 9.5

### (API) UpdateSharedChannelCursor 

```
UpdateSharedChannelCursor(channelID, remoteID string, cusror model.GetPostsSinceForSyncCursor) error
```

UpdateSharedChannelCursor updates the cursor for the specified channel and RemoteID (passed by the plugin when registering). This can be used to manually set the point of last sync, either forward to skip older posts, or backward to re-sync history. This call by itself does not force a re-sync - a change to channel contents or a call to SyncSharedChannel are needed to force a sync.

@tag SharedChannels Minimum server version: 9.5

### (API) SyncSharedChannel 

```
SyncSharedChannel(channelID string) error
```

SyncSharedChannel forces a shared channel to send any changed content to all remotes.

@tag SharedChannels Minimum server version: 9.5

### (API) InviteRemoteToChannel 

```
InviteRemoteToChannel(channelID string, remoteID string, userID string, shareIfNotShared bool) error
```

InviteRemoteToChannel invites a remote, or this plugin, as a target for synchronizing. Once invited, the remote will start to receive synchronization messages for any changed content in the specified channel. If \`shareIfNotShared\` is true, the channel's shared flag will be set, if not already.

@tag SharedChannels Minimum server version: 9.5

### (API) UninviteRemoteFromChannel 

```
UninviteRemoteFromChannel(channelID string, remoteID string) error
```

UninviteRemoteFromChannel uninvites a remote, or this plugin, such that it will stop receiving sychronization messages for the channel.

@tag SharedChannels Minimum server version: 9.5

### (API) UpsertGroupMember 

```
UpsertGroupMember(groupID string, userID string) (*model.GroupMember, *model.AppError)
```

UpsertGroupMember adds a user to a group or updates their existing membership.

@tag Group @tag User Minimum server version: 10.7

### (API) UpsertGroupMembers 

```
UpsertGroupMembers(groupID string, userIDs []string) ([]*model.GroupMember, *model.AppError)
```

UpsertGroupMembers adds multiple users to a group or updates their existing memberships.

@tag Group @tag User Minimum server version: 10.7

### (API) GetGroupByRemoteID 

```
GetGroupByRemoteID(remoteID string, groupSource model.GroupSource) (*model.Group, *model.AppError)
```

GetGroupByRemoteID gets a group by its remote ID.

@tag Group Minimum server version: 10.7

### (API) CreateGroup 

```
CreateGroup(group *model.Group) (*model.Group, *model.AppError)
```

CreateGroup creates a new group.

@tag Group Minimum server version: 10.7

### (API) UpdateGroup 

```
UpdateGroup(group *model.Group) (*model.Group, *model.AppError)
```

UpdateGroup updates a group.

@tag Group Minimum server version: 10.7

### (API) DeleteGroup 

```
DeleteGroup(groupID string) (*model.Group, *model.AppError)
```

DeleteGroup soft deletes a group.

@tag Group Minimum server version: 10.7

### (API) RestoreGroup 

```
RestoreGroup(groupID string) (*model.Group, *model.AppError)
```

RestoreGroup restores a soft deleted group.

@tag Group Minimum server version: 10.7

### (API) DeleteGroupMember 

```
DeleteGroupMember(groupID string, userID string) (*model.GroupMember, *model.AppError)
```

DeleteGroupMember removes a user from a group.

@tag Group @tag User Minimum server version: 10.7

### (API) GetGroupSyncable 

```
GetGroupSyncable(groupID string, syncableID string, syncableType model.GroupSyncableType) (*model.GroupSyncable, *model.AppError)
```

GetGroupSyncable gets a group syncable.

@tag Group Minimum server version: 10.7

### (API) GetGroupSyncables 

```
GetGroupSyncables(groupID string, syncableType model.GroupSyncableType) ([]*model.GroupSyncable, *model.AppError)
```

GetGroupSyncables gets all group syncables for the given group.

@tag Group Minimum server version: 10.7

### (API) UpsertGroupSyncable 

```
UpsertGroupSyncable(groupSyncable *model.GroupSyncable) (*model.GroupSyncable, *model.AppError)
```

UpsertGroupSyncable creates or updates a group syncable.

@tag Group Minimum server version: 10.7

### (API) UpdateGroupSyncable 

```
UpdateGroupSyncable(groupSyncable *model.GroupSyncable) (*model.GroupSyncable, *model.AppError)
```

UpdateGroupSyncable updates a group syncable.

@tag Group Minimum server version: 10.7

### (API) DeleteGroupSyncable 

```
DeleteGroupSyncable(groupID string, syncableID string, syncableType model.GroupSyncableType) (*model.GroupSyncable, *model.AppError)
```

DeleteGroupSyncable deletes a group syncable.

@tag Group Minimum server version: 10.7

### (API) UpdateUserRoles 

```
UpdateUserRoles(userID, newRoles string) (*model.User, *model.AppError)
```

UpdateUserRoles updates the role for a user.

@tag Team @tag User Minimum server version: 9.8

### (API) GetPluginID 

```
GetPluginID() string
```

GetPluginID returns the plugin ID.

@tag Plugin Minimum server version: 10.1

### (API) GetGroups 

```
GetGroups(page, perPage int, opts model.GroupSearchOpts, viewRestrictions *model.ViewUsersRestrictions) ([]*model.Group, *model.AppError)
```

GetGroups returns a list of all groups with the given options and restrictions.

@tag Group Minimum server version: 10.7

### (API) CreateDefaultSyncableMemberships 

```
CreateDefaultSyncableMemberships(params model.CreateDefaultMembershipParams) *model.AppError
```

CreateDefaultSyncableMemberships creates default syncable memberships based off the provided parameters.

@tag Group Minimum server version: 10.9

### (API) DeleteGroupConstrainedMemberships 

```
DeleteGroupConstrainedMemberships() *model.AppError
```

DeleteGroupConstrainedMemberships deletes team and channel memberships of users who aren't members of the allowed groups of all group-constrained teams and channels.

@tag Group Minimum server version: 10.9

### (API) CreatePropertyField 

```
CreatePropertyField(field *model.PropertyField) (*model.PropertyField, error)
```

CreatePropertyField creates a new property field.

@tag PropertyField Minimum server version: 10.10

### (API) GetPropertyField 

```
GetPropertyField(groupID, fieldID string) (*model.PropertyField, error)
```

GetPropertyField gets a property field by groupID and fieldID.

@tag PropertyField Minimum server version: 10.10

### (API) GetPropertyFields 

```
GetPropertyFields(groupID string, ids []string) ([]*model.PropertyField, error)
```

GetPropertyFields gets multiple property fields by groupID and a list of IDs.

@tag PropertyField Minimum server version: 10.10

### (API) UpdatePropertyField 

```
UpdatePropertyField(groupID string, field *model.PropertyField) (*model.PropertyField, error)
```

UpdatePropertyField updates an existing property field.

@tag PropertyField Minimum server version: 10.10

### (API) DeletePropertyField 

```
DeletePropertyField(groupID, fieldID string) error
```

DeletePropertyField deletes a property field (soft delete).

@tag PropertyField Minimum server version: 10.10

### (API) SearchPropertyFields 

```
SearchPropertyFields(groupID, targetID string, opts model.PropertyFieldSearchOpts) ([]*model.PropertyField, error)
```

SearchPropertyFields searches for property fields with filtering options.

@tag PropertyField Minimum server version: 10.10

### (API) CreatePropertyValue 

```
CreatePropertyValue(value *model.PropertyValue) (*model.PropertyValue, error)
```

CreatePropertyValue creates a new property value.

@tag PropertyValue Minimum server version: 10.10

### (API) GetPropertyValue 

```
GetPropertyValue(groupID, valueID string) (*model.PropertyValue, error)
```

GetPropertyValue gets a property value by groupID and valueID.

@tag PropertyValue Minimum server version: 10.10

### (API) GetPropertyValues 

```
GetPropertyValues(groupID string, ids []string) ([]*model.PropertyValue, error)
```

GetPropertyValues gets multiple property values by groupID and a list of IDs.

@tag PropertyValue Minimum server version: 10.10

### (API) UpdatePropertyValue 

```
UpdatePropertyValue(groupID string, value *model.PropertyValue) (*model.PropertyValue, error)
```

UpdatePropertyValue updates an existing property value.

@tag PropertyValue Minimum server version: 10.10

### (API) UpsertPropertyValue 

```
UpsertPropertyValue(value *model.PropertyValue) (*model.PropertyValue, error)
```

UpsertPropertyValue creates a new property value or updates if it already exists.

@tag PropertyValue Minimum server version: 10.10

### (API) DeletePropertyValue 

```
DeletePropertyValue(groupID, valueID string) error
```

DeletePropertyValue deletes a property value (soft delete).

@tag PropertyValue Minimum server version: 10.10

### (API) SearchPropertyValues 

```
SearchPropertyValues(groupID, targetID string, opts model.PropertyValueSearchOpts) ([]*model.PropertyValue, error)
```

SearchPropertyValues searches for property values with filtering options.

@tag PropertyValue Minimum server version: 10.10

### (API) RegisterPropertyGroup 

```
RegisterPropertyGroup(name string) (*model.PropertyGroup, error)
```

RegisterPropertyGroup registers a new property group.

@tag PropertyGroup Minimum server version: 10.10

### (API) GetPropertyGroup 

```
GetPropertyGroup(name string) (*model.PropertyGroup, error)
```

GetPropertyGroup gets a property group by name.

@tag PropertyGroup Minimum server version: 10.10

### (API) GetPropertyFieldByName 

```
GetPropertyFieldByName(groupID, targetID, name string) (*model.PropertyField, error)
```

GetPropertyFieldByName gets a property field by groupID, targetID and name.

@tag PropertyField Minimum server version: 10.10

### (API) UpdatePropertyFields 

```
UpdatePropertyFields(groupID string, fields []*model.PropertyField) ([]*model.PropertyField, error)
```

UpdatePropertyFields updates multiple property fields in a single operation.

@tag PropertyField Minimum server version: 10.10

### (API) UpdatePropertyValues 

```
UpdatePropertyValues(groupID string, values []*model.PropertyValue) ([]*model.PropertyValue, error)
```

UpdatePropertyValues updates multiple property values in a single operation.

@tag PropertyValue Minimum server version: 10.10

### (API) UpsertPropertyValues 

```
UpsertPropertyValues(values []*model.PropertyValue) ([]*model.PropertyValue, error)
```

UpsertPropertyValues creates or updates multiple property values in a single operation.

@tag PropertyValue Minimum server version: 10.10

### (API) DeletePropertyValuesForTarget 

```
DeletePropertyValuesForTarget(groupID, targetType, targetID string) error
```

DeletePropertyValuesForTarget deletes all property values for a specific target.

@tag PropertyValue Minimum server version: 10.10

### (API) DeletePropertyValuesForField 

```
DeletePropertyValuesForField(groupID, fieldID string) error
```

DeletePropertyValuesForField deletes all property values for a specific field.

@tag PropertyValue Minimum server version: 10.10

### (API) LogAuditRec 

```
LogAuditRec(rec *model.AuditRecord) 
```

LogAuditRec logs an audit record using the default audit logger.

@tag Audit Minimum server version: 10.10

### (API) LogAuditRecWithLevel 

```
LogAuditRecWithLevel(rec *model.AuditRecord, level mlog.Level) 
```

LogAuditRecWithLevel logs an audit record with a specific log level.

@tag Audit Minimum server version: 10.10

---

## Hooks

### (Hooks) OnActivate 

```
OnActivate() error
```

OnActivate is invoked when the plugin is activated. If an error is returned, the plugin will be terminated. The plugin will not receive hooks until after OnActivate returns without error. OnConfigurationChange will be called once before OnActivate.

Minimum server version: 5.2

### (Hooks) Implemented 

```
Implemented() ([]string, error)
```

Implemented returns a list of hooks that are implemented by the plugin. Plugins do not need to provide an implementation. Any given will be ignored.

Minimum server version: 5.2

### (Hooks) OnDeactivate 

```
OnDeactivate() error
```

OnDeactivate is invoked when the plugin is deactivated. This is the plugin's last chance to use the API, and the plugin will be terminated shortly after this invocation. The plugin will stop receiving hooks just prior to this method being called.

Minimum server version: 5.2

### (Hooks) OnConfigurationChange 

```
OnConfigurationChange() error
```

OnConfigurationChange is invoked when configuration changes may have been made. Any returned error is logged, but does not stop the plugin. You must be prepared to handle a configuration failure gracefully. It is called once before OnActivate.

Minimum server version: 5.2

### (Hooks) ServeHTTP 

```
ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) 
```

ServeHTTP allows the plugin to implement the http.Handler interface. Requests destined for the /plugins/{id} path will be routed to the plugin.

The Mattermost-User-Id header will be present if (and only if) the request is by an authenticated user.

Minimum server version: 5.2

### (Hooks) ExecuteCommand 

```
ExecuteCommand(c *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError)
```

ExecuteCommand executes a command that has been previously registered via the RegisterCommand API.

Minimum server version: 5.2

### (Hooks) UserHasBeenCreated 

```
UserHasBeenCreated(c *plugin.Context, user *model.User) 
```

UserHasBeenCreated is invoked after a user was created.

Minimum server version: 5.10

### (Hooks) UserWillLogIn 

```
UserWillLogIn(c *plugin.Context, user *model.User) string
```

UserWillLogIn before the login of the user is returned. Returning a non empty string will reject the login event. If you don't need to reject the login event, see UserHasLoggedIn

Minimum server version: 5.2

### (Hooks) UserHasLoggedIn 

```
UserHasLoggedIn(c *plugin.Context, user *model.User) 
```

UserHasLoggedIn is invoked after a user has logged in.

Minimum server version: 5.2

### (Hooks) MessageWillBePosted 

```
MessageWillBePosted(c *plugin.Context, post *model.Post) (*model.Post, string)
```

MessageWillBePosted is invoked when a message is posted by a user before it is committed to the database. If you also want to act on edited posts, see MessageWillBeUpdated.

To reject a post, return an non-empty string describing why the post was rejected. To modify the post, return the replacement, non-nil \*model.Post and an empty string. To allow the post without modification, return a nil \*model.Post and an empty string. To dismiss the post, return a nil \*model.Post and the const DismissPostError string.

If you don't need to modify or reject posts, use MessageHasBeenPosted instead.

Note that this method will be called for posts created by plugins, including the plugin that created the post.

Minimum server version: 5.2

### (Hooks) MessageWillBeUpdated 

```
MessageWillBeUpdated(c *plugin.Context, newPost, oldPost *model.Post) (*model.Post, string)
```

MessageWillBeUpdated is invoked when a message is updated by a user before it is committed to the database. If you also want to act on new posts, see MessageWillBePosted. Return values should be the modified post or nil if rejected and an explanation for the user. On rejection, the post will be kept in its previous state.

If you don't need to modify or rejected updated posts, use MessageHasBeenUpdated instead.

Note that this method will be called for posts updated by plugins, including the plugin that updated the post.

Minimum server version: 5.2

### (Hooks) MessageHasBeenPosted 

```
MessageHasBeenPosted(c *plugin.Context, post *model.Post) 
```

MessageHasBeenPosted is invoked after the message has been committed to the database. If you need to modify or reject the post, see MessageWillBePosted Note that this method will be called for posts created by plugins, including the plugin that created the post.

Minimum server version: 5.2

### (Hooks) MessageHasBeenUpdated 

```
MessageHasBeenUpdated(c *plugin.Context, newPost, oldPost *model.Post) 
```

MessageHasBeenUpdated is invoked after a message is updated and has been updated in the database. If you need to modify or reject the post, see MessageWillBeUpdated Note that this method will be called for posts created by plugins, including the plugin that created the post.

Minimum server version: 5.2

### (Hooks) MessagesWillBeConsumed 

```
MessagesWillBeConsumed(posts []*model.Post) []*model.Post
```

MessagesWillBeConsumed is invoked when a message is requested by a client before it is returned to the client

Note that this method will be called for posts created by plugins, including the plugin that created the post.

Minimum server version: 9.3

### (Hooks) MessageHasBeenDeleted 

```
MessageHasBeenDeleted(c *plugin.Context, post *model.Post) 
```

MessageHasBeenDeleted is invoked after the message has been deleted from the database. Note that this method will be called for posts deleted by plugins, including the plugin that deleted the post.

Minimum server version: 9.1

### (Hooks) ChannelHasBeenCreated 

```
ChannelHasBeenCreated(c *plugin.Context, channel *model.Channel) 
```

ChannelHasBeenCreated is invoked after the channel has been committed to the database.

Minimum server version: 5.2

### (Hooks) UserHasJoinedChannel 

```
UserHasJoinedChannel(c *plugin.Context, channelMember *model.ChannelMember, actor *model.User) 
```

UserHasJoinedChannel is invoked after the membership has been committed to the database. If actor is not nil, the user was invited to the channel by the actor.

Minimum server version: 5.2

### (Hooks) UserHasLeftChannel 

```
UserHasLeftChannel(c *plugin.Context, channelMember *model.ChannelMember, actor *model.User) 
```

UserHasLeftChannel is invoked after the membership has been removed from the database. If actor is not nil, the user was removed from the channel by the actor.

Minimum server version: 5.2

### (Hooks) UserHasJoinedTeam 

```
UserHasJoinedTeam(c *plugin.Context, teamMember *model.TeamMember, actor *model.User) 
```

UserHasJoinedTeam is invoked after the membership has been committed to the database. If actor is not nil, the user was added to the team by the actor.

Minimum server version: 5.2

### (Hooks) UserHasLeftTeam 

```
UserHasLeftTeam(c *plugin.Context, teamMember *model.TeamMember, actor *model.User) 
```

UserHasLeftTeam is invoked after the membership has been removed from the database. If actor is not nil, the user was removed from the team by the actor.

Minimum server version: 5.2

### (Hooks) FileWillBeUploaded 

```
FileWillBeUploaded(c *plugin.Context, info *model.FileInfo, file io.Reader, output io.Writer) (*model.FileInfo, string)
```

FileWillBeUploaded is invoked when a file is uploaded, but before it is committed to backing store. Read from file to retrieve the body of the uploaded file.

To reject a file upload, return an non-empty string describing why the file was rejected. To modify the file, write to the output and/or return a non-nil \*model.FileInfo, as well as an empty string. To allow the file without modification, do not write to the output and return a nil \*model.FileInfo and an empty string.

Note that this method will be called for files uploaded by plugins, including the plugin that uploaded the post. FileInfo.Size will be automatically set properly if you modify the file.

Minimum server version: 5.2

### (Hooks) ReactionHasBeenAdded 

```
ReactionHasBeenAdded(c *plugin.Context, reaction *model.Reaction) 
```

ReactionHasBeenAdded is invoked after the reaction has been committed to the database.

Note that this method will be called for reactions added by plugins, including the plugin that added the reaction.

Minimum server version: 5.30

### (Hooks) ReactionHasBeenRemoved 

```
ReactionHasBeenRemoved(c *plugin.Context, reaction *model.Reaction) 
```

ReactionHasBeenRemoved is invoked after the removal of the reaction has been committed to the database.

Note that this method will be called for reactions removed by plugins, including the plugin that removed the reaction.

Minimum server version: 5.30

### (Hooks) OnPluginClusterEvent 

```
OnPluginClusterEvent(c *plugin.Context, ev model.PluginClusterEvent) 
```

OnPluginClusterEvent is invoked when an intra-cluster plugin event is received.

This is used to allow communication between multiple instances of the same plugin that are running on separate nodes of the same High-Availability cluster. This hook receives events sent by a call to PublishPluginClusterEvent.

Minimum server version: 5.36

### (Hooks) OnWebSocketConnect 

```
OnWebSocketConnect(webConnID, userID string) 
```

OnWebSocketConnect is invoked when a new websocket connection is opened.

This is used to track which users have connections opened with the Mattermost websocket.

Minimum server version: 6.0

### (Hooks) OnWebSocketDisconnect 

```
OnWebSocketDisconnect(webConnID, userID string) 
```

OnWebSocketDisconnect is invoked when a websocket connection is closed.

This is used to track which users have connections opened with the Mattermost websocket.

Minimum server version: 6.0

### (Hooks) WebSocketMessageHasBeenPosted 

```
WebSocketMessageHasBeenPosted(webConnID, userID string, req *model.WebSocketRequest) 
```

WebSocketMessageHasBeenPosted is invoked when a websocket message is received.

Minimum server version: 6.0

### (Hooks) RunDataRetention 

```
RunDataRetention(nowTime, batchSize int64) (int64, error)
```

RunDataRetention is invoked during a DataRetentionJob.

Minimum server version: 6.4

### (Hooks) OnInstall 

```
OnInstall(c *plugin.Context, event model.OnInstallEvent) error
```

OnInstall is invoked after the installation of a plugin as part of the onboarding. It's called on every installation, not only once.

In the future, other plugin installation methods will trigger this hook, e.g. an installation via the Marketplace.

Minimum server version: 6.5

### (Hooks) OnSendDailyTelemetry 

```
OnSendDailyTelemetry() 
```

OnSendDailyTelemetry is invoked when the server send the daily telemetry data.

Minimum server version: 6.5

### (Hooks) OnCloudLimitsUpdated 

```
OnCloudLimitsUpdated(limits *model.ProductLimits) 
```

OnCloudLimitsUpdated is invoked product limits change, for example when plan tiers change

Minimum server version: 7.0

### (Hooks) ConfigurationWillBeSaved 

```
ConfigurationWillBeSaved(newCfg *model.Config) (*model.Config, error)
```

ConfigurationWillBeSaved is invoked before saving the configuration to the backing store. An error can be returned to reject the operation. Additionally, a new config object can be returned to be stored in place of the provided one. Minimum server version: 8.0

### (Hooks) NotificationWillBePushed 

```
NotificationWillBePushed(pushNotification *model.PushNotification, userID string) (*model.PushNotification, string)
```

NotificationWillBePushed is invoked before a push notification is sent to the push notification server.

To reject a notification, return an non-empty string describing why the notification was rejected. To modify the notification, return the replacement, non-nil \*model.PushNotification and an empty string. To allow the notification without modification, return a nil \*model.PushNotification and an empty string.

Note that this method will be called for push notifications created by plugins, including the plugin that created the notification.

Minimum server version: 9.0

### (Hooks) UserHasBeenDeactivated 

```
UserHasBeenDeactivated(c *plugin.Context, user *model.User) 
```

UserHasBeenDeactivated is invoked when a user is deactivated.

Minimum server version: 9.1

### (Hooks) ServeMetrics 

```
ServeMetrics(c *plugin.Context, w http.ResponseWriter, r *http.Request) 
```

ServeMetrics allows plugins to expose their own metrics endpoint through the server's metrics HTTP listener (e.g. "localhost:8067"). Requests destined to the /plugins/{id}/metrics path will be routed to the plugin.

Minimum server version: 9.2

### (Hooks) OnSharedChannelsSyncMsg 

```
OnSharedChannelsSyncMsg(msg *model.SyncMsg, rc *model.RemoteCluster) (model.SyncResponse, error)
```

OnSharedChannelsSyncMsg is invoked for plugins that wish to receive synchronization messages from the Shared Channels service for which they have been invited via InviteRemote. Each SyncMsg may contain multiple updates (posts, reactions, attachments, users) for a single channel.

The cursor will be advanced based on the SyncResponse returned.

Minimum server version: 9.5

### (Hooks) OnSharedChannelsPing 

```
OnSharedChannelsPing(rc *model.RemoteCluster) bool
```

OnSharedChannelsPing is invoked for plugins to indicate the health of the plugin and the connection to the upstream service (e.g. MS Graph APIs).

Return true to indicate all is well.

Return false to indicate there is a problem with the plugin or connection to upstream service. Some number of failed pings will result in the plugin being marked offline and it will stop receiving OnSharedChannelsSyncMsg calls until it comes back online. The plugin will also appear offline in the status report via the \`secure-connection status\` slash command.

Minimum server version: 9.5

### (Hooks) PreferencesHaveChanged 

```
PreferencesHaveChanged(c *plugin.Context, preferences []model.Preference) 
```

PreferencesHaveChanged is invoked after one or more of a user's preferences have changed. Note that this method will be called for preferences changed by plugins, including the plugin that changed the preferences.

Minimum server version: 9.5

### (Hooks) OnSharedChannelsAttachmentSyncMsg 

```
OnSharedChannelsAttachmentSyncMsg(fi *model.FileInfo, post *model.Post, rc *model.RemoteCluster) error
```

OnSharedChannelsAttachmentSyncMsg is invoked for plugins that wish to receive synchronization messages from the Shared Channels service for which they have been invited via InviteRemote. Each call represents one file attachment to be synchronized.

The cursor will be advanced based on the timestamp returned if no error is returned.

Minimum server version: 9.5

### (Hooks) OnSharedChannelsProfileImageSyncMsg 

```
OnSharedChannelsProfileImageSyncMsg(user *model.User, rc *model.RemoteCluster) error
```

OnSharedChannelsProfileImageSyncMsg is invoked for plugins that wish to receive synchronization messages from the Shared Channels service for which they have been invited via InviteRemote. Each call represents one user profile image that should be synchronized. \`App.GetProfileImage\` can be used to fetch the image bytes.

The cursor will be advanced based on the timestamp returned if no error is returned.

Minimum server version: 9.5

### (Hooks) GenerateSupportData 

```
GenerateSupportData(c *plugin.Context) ([]*model.FileData, error)
```

GenerateSupportData is invoked when a Support Packet gets generated. It allows plugins to include their own content in the Support Packet.

Plugins may specififes a "support\_packet" field in the manifest props with a custom text. By doing so, the plugin will be included in the Support Packet UI and the user will be able to select it. This hook will only be called, if the user selects the plugin in the Support Packet UI.

If no "support\_packet" is specified, this hook will always be called.

Minimum server version: 9.8

### (Hooks) OnSAMLLogin 

```
OnSAMLLogin(c *plugin.Context, user *model.User, assertion *gosaml2.AssertionInfo) error
```

OnSAMLLogin is invoked after a successful SAML login.

Minimum server version: 10.7

---

## Helpers

---

## Examples

### (Example) HelloWorld 

This example demonstrates a plugin that handles HTTP requests which respond by greeting the world.

```go
package main

import (
	"fmt"
	"net/http"

	"github.com/mattermost/mattermost/server/public/plugin"
)

// HelloWorldPlugin implements the interface expected by the Mattermost server to communicate
// between the server and plugin processes.
type HelloWorldPlugin struct {
	plugin.MattermostPlugin
}

// ServeHTTP demonstrates a plugin that handles HTTP requests by greeting the world.
func (p *HelloWorldPlugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Hello, world!")
}

// This example demonstrates a plugin that handles HTTP requests which respond by greeting the
// world.
func main() {
	plugin.ClientMain(&HelloWorldPlugin{})
}

```

### (Example) HelpPlugin 

```go
package main

import (
	"strings"
	"sync"

	"github.com/pkg/errors"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
)

// configuration represents the configuration for this plugin as exposed via the Mattermost
// server configuration.
type configuration struct {
	TeamName	string
	ChannelName	string

	// channelID is resolved when the public configuration fields above change
	channelID	string
}

// HelpPlugin implements the interface expected by the Mattermost server to communicate
// between the server and plugin processes.
type HelpPlugin struct {
	plugin.MattermostPlugin

	// configurationLock synchronizes access to the configuration.
	configurationLock	sync.RWMutex

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration	*configuration
}

// getConfiguration retrieves the active configuration under lock, making it safe to use
// concurrently. The active configuration may change underneath the client of this method, but
// the struct returned by this API call is considered immutable.
func (p *HelpPlugin) getConfiguration() *configuration {
	p.configurationLock.RLock()
	defer p.configurationLock.RUnlock()

	if p.configuration == nil {
		return &configuration{}
	}

	return p.configuration
}

// setConfiguration replaces the active configuration under lock.
//
// Do not call setConfiguration while holding the configurationLock, as sync.Mutex is not
// reentrant.
func (p *HelpPlugin) setConfiguration(configuration *configuration) {
	// Replace the active configuration under lock.
	p.configurationLock.Lock()
	defer p.configurationLock.Unlock()
	p.configuration = configuration
}

// OnConfigurationChange updates the active configuration for this plugin under lock.
func (p *HelpPlugin) OnConfigurationChange() error {
	var configuration = new(configuration)

	// Load the public configuration fields from the Mattermost server configuration.
	if err := p.API.LoadPluginConfiguration(configuration); err != nil {
		return errors.Wrap(err, "failed to load plugin configuration")
	}

	team, err := p.API.GetTeamByName(configuration.TeamName)
	if err != nil {
		return errors.Wrapf(err, "failed to find team %s", configuration.TeamName)
	}

	channel, err := p.API.GetChannelByName(team.Id, configuration.ChannelName, false)
	if err != nil {
		return errors.Wrapf(err, "failed to find channel %s", configuration.ChannelName)
	}

	configuration.channelID = channel.Id

	p.setConfiguration(configuration)

	return nil
}

// MessageHasBeenPosted automatically replies to posts that plea for help.
func (p *HelpPlugin) MessageHasBeenPosted(c *plugin.Context, post *model.Post) {
	configuration := p.getConfiguration()

	// Ignore posts not in the configured channel
	if post.ChannelId != configuration.channelID {
		return
	}

	// Ignore posts this plugin made.
	if sentByPlugin, _ := post.GetProp("sent_by_plugin").(bool); sentByPlugin {
		return
	}

	// Ignore posts without a plea for help.
	if !strings.Contains(post.Message, "help") {
		return
	}

	p.API.SendEphemeralPost(post.UserId, &model.Post{
		ChannelId:	configuration.channelID,
		Message:	"You asked for help? Checkout https://support.mattermost.com/hc/en-us",
		Props: map[string]any{
			"sent_by_plugin": true,
		},
	})
}

func main() {
	plugin.ClientMain(&HelpPlugin{})
}

```

© Mattermost, Inc. 2026. Terms of Use | Privacy Policy | Cookie Policy

* GitHub icon
* Facebook icon
* X icon

Did you find what you were looking for?

😀 Yes 😐 Mostly 🙁 No! 

Thank you! We appreciate your feedback. 

× 

## Tell us more

Your feedback helps us improve the Mattermost developer documentation.  

0/186 

 Have a feature request?  Share it here. 

 Having issues?  Join our Community server. 

Submit 