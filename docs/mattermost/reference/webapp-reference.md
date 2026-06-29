# Webapp Plugin SDK Reference (snapshot)

> **Онлайн-версия:** https://developers.mattermost.com/integrate/reference/webapp/webapp-reference/
>
> Локальная копия для offline-справки. При расхождениях — приоритет у онлайн-документации.

---

Source URL: https://developers.mattermost.com/integrate/reference/webapp/webapp-reference/
Title:  Web app plugin SDK reference

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

Web app plugin SDK reference 

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

#  Mattermost web app plugin SDK reference

Visit the Plugins section to learn more about developing Mattermost plugins and our recommended developer workflow for Mattermost plugins.

## Table of contents 

* PluginClass  
   * Example
* Registry
* Theme
* Exported Libraries and Functions  
   * post-utils  
         * formatText(text, options)  
         * messageHtmlToComponent(html, isRHS, options)  
         * Usage Example

## PluginClass 

The PluginClass interface defines two methods used by the Mattermost Web App to `initialize` and `uninitialize` your plugin:

```javascript
class PluginClass {
    /**
    * initialize is called by the webapp when the plugin is first loaded.
    * Receives the following:
    * - registry - an instance of the registry tied to your plugin id
    * - store - the Redux store of the web app.
    */
    initialize(registry, store)

    /**
    * uninitialize is called by the webapp if your plugin is uninstalled
    */
    uninitialize()
}

```

Your plugin should implement this class and register it using the global `registerPlugin` method defined on the window by the webapp:

```javascript
window.registerPlugin('myplugin', new PluginClass());

```

Use the provided registry to register components, post type overrides and callbacks. Use the store to access the global state of the web app, but note that you should use the registry to register any custom reducers your plugin might require.

### Example 

The entry point `index.js` of your application might contain:

```javascript
import UserPopularity from './components/profile_popover/user_popularity';
import SomePost from './components/some_post';
import MenuIcon from './components/menu_icon';
import {openExampleModal} from './actions';

class PluginClass {
    initialize(registry, store) {
        registry.registerPopoverUserAttributesComponent(
            UserPopularity,
        );
        registry.registerPostTypeComponent(
            'custom_somepost',
            SomePost,
        );
        registry.registerMainMenuAction(
            'Plugin Menu Item',
            () => store.dispatch(openExampleModal()),
            mobile_icon: MenuIcon,
        );
    }

    uninitialize() {
        // No clean up required.
    }
}

window.registerPlugin('myplugin', new PluginClass());

```

This will add a custom `UserPopularity` component to the profile popover, render a custom `SomePost` component for any post with the type `custom_somepost`, and insert a custom main menu item.

## Registry 

An instance of the plugin registry is passed to each plugin via the `initialize` callback.

* registerRootComponent(\[component\])
* registerPopoverUserAttributesComponent(\[component\])
* registerPopoverUserActionsComponent(\[component\])
* registerLeftSidebarHeaderComponent(\[component\])
* registerBottomTeamSidebarComponent(\[component\])
* registerPostMessageAttachmentComponent(\[component\])
* registerLinkTooltipComponent(\[component\])
* registerActionAfterChannelCreation(\[component action\])
* registerChannelHeaderIcon(\[component\])
* registerChannelHeaderButtonAction(\[icon action dropdownText tooltipText\])
* registerChannelIntroButtonAction(\[icon action text\])
* registerCallButtonAction(\[button dropdownButton action icon dropdownText\])
* registerPostTypeComponent(\[type component\])
* registerPostCardTypeComponent(\[type component\])
* registerPostWillRenderEmbedComponent(\[match component toggleable\])
* registerMainMenuAction(\[text action mobileIcon\])
* registerChannelHeaderMenuAction(\[text action shouldRender\])
* registerFileDropdownMenuAction(\[match text action\])
* registerUserGuideDropdownMenuAction(\[text action\])
* registerPostActionComponent(\[component\])
* registerPostEditorActionComponent(\[component\])
* registerAIActionMenuItemComponent(\[icon text sortOrder component action\])
* registerCodeBlockActionComponent(\[component\])
* registerNewMessagesSeparatorActionComponent(\[component\])
* registerPostDropdownMenuAction(\[text action filter\])
* registerPostDropdownSubMenuAction(\[text action filter\])
* registerPostDropdownMenuComponent(\[component\])
* registerFileUploadMethod(\[icon action text\])
* registerFilesWillUploadHook(\[hook\])
* unregisterComponent(\[componentId\])
* unregisterPostTypeComponent(\[componentId\])
* registerReducer(\[reducer\])
* registerWebSocketEventHandler(\[event handler\])
* unregisterWebSocketEventHandler(\[event\])
* registerReconnectHandler(\[handler\])
* unregisterReconnectHandler()
* registerMessageWillBePostedHook(\[hook\])
* registerSlashCommandWillBePostedHook(\[hook\])
* registerMessageWillFormatHook(\[hook\])
* registerFilePreviewComponent(\[override component\])
* registerTranslations(\[getTranslationsForLocale\])
* registerAdminConsolePlugin(\[func\])
* unregisterAdminConsolePlugin()
* registerAdminConsoleCustomSetting(\[key component options\])
* registerAdminConsoleCustomSection(\[key component\])
* registerRightHandSidebarComponent(\[component title showPopout\])
* registerNeedsTeamRoute(\[route component\])
* registerCustomRoute(\[route component\])
* registerProduct(\[baseURL switcherIcon switcherText switcherLinkURL mainComponent headerCentreComponent headerRightComponent showTeamSidebar showAppBar wrapped publicComponent\])
* registerMessageWillBeUpdatedHook(\[hook\])
* registerSidebarChannelLinkLabelComponent(\[component\])
* registerSidebarBrowseOrAddChannelMenuAction(\[text action icon\])
* registerChannelTypeOption(\[label description icon isAvailable extraContent onCreate createButtonText\])
* registerChannelIconOverride(\[matcher iconName\])
* registerChannelComposerBannerComponent(\[component\])
* registerChannelIntro(\[matcher component\])
* registerPostHeaderComponent(\[component\])
* registerComposerPlaceholder(\[transform\])
* registerProductSwitcherMenuItem(\[text icon action isHidden\])
* registerChannelToastComponent(\[component\])
* registerGlobalComponent(\[component\])
* registerAppBarComponent(\[iconUrl action tooltipText supportedProductIds rhsComponent rhsTitle\])
* registerSiteStatisticsHandler(\[handler\])
* registerDesktopNotificationHook(\[hook\])
* registerUserSettings(\[setting\])
* registerSystemConsoleGroupTable(\[component\])
* registerRHSPluginPopoutListener(\[pluginId onPopoutOpened\])

---

##### registerRootComponent 

```
/**
*/
registerRootComponent([component])
```

##### registerPopoverUserAttributesComponent 

```
/**
*/
registerPopoverUserAttributesComponent([component])
```

##### registerPopoverUserActionsComponent 

```
/**
*/
registerPopoverUserActionsComponent([component])
```

##### registerLeftSidebarHeaderComponent 

```
/**
*/
registerLeftSidebarHeaderComponent([component])
```

##### registerBottomTeamSidebarComponent 

```
/**
*/
registerBottomTeamSidebarComponent([component])
```

##### registerPostMessageAttachmentComponent 

```
/**
*/
registerPostMessageAttachmentComponent([component])
```

##### registerLinkTooltipComponent 

```
/**
*/
registerLinkTooltipComponent([component])
```

##### registerActionAfterChannelCreation 

```
/**
*/
registerActionAfterChannelCreation([component action])
```

##### registerChannelHeaderIcon 

```
/**
*/
registerChannelHeaderIcon([component])
```

##### registerChannelHeaderButtonAction 

```
/**
*/
registerChannelHeaderButtonAction([icon action dropdownText tooltipText])
```

##### registerChannelIntroButtonAction 

```
/**
*/
registerChannelIntroButtonAction([icon action text])
```

##### registerCallButtonAction 

```
/**
*/
registerCallButtonAction([button dropdownButton action icon dropdownText])
```

##### registerPostTypeComponent 

```
/**
*/
registerPostTypeComponent([type component])
```

##### registerPostCardTypeComponent 

```
/**
*/
registerPostCardTypeComponent([type component])
```

##### registerPostWillRenderEmbedComponent 

```
/**
*/
registerPostWillRenderEmbedComponent([match component toggleable])
```

##### registerMainMenuAction 

```
/**
*/
registerMainMenuAction([text action mobileIcon])
```

##### registerChannelHeaderMenuAction 

```
/**
*/
registerChannelHeaderMenuAction([text action shouldRender])
```

##### registerFileDropdownMenuAction 

```
/**
*/
registerFileDropdownMenuAction([match text action])
```

##### registerUserGuideDropdownMenuAction 

```
/**
*/
registerUserGuideDropdownMenuAction([text action])
```

##### registerPostActionComponent 

```
/**
*/
registerPostActionComponent([component])
```

##### registerPostEditorActionComponent 

```
/**
*/
registerPostEditorActionComponent([component])
```

##### registerAIActionMenuItemComponent 

```
/**
*/
registerAIActionMenuItemComponent([icon text sortOrder component action])
```

##### registerCodeBlockActionComponent 

```
/**
*/
registerCodeBlockActionComponent([component])
```

##### registerNewMessagesSeparatorActionComponent 

```
/**
*/
registerNewMessagesSeparatorActionComponent([component])
```

##### registerPostDropdownMenuAction 

```
/**
*/
registerPostDropdownMenuAction([text action filter])
```

##### registerPostDropdownSubMenuAction 

```
/**
*/
registerPostDropdownSubMenuAction([text action filter])
```

##### registerPostDropdownMenuComponent 

```
/**
*/
registerPostDropdownMenuComponent([component])
```

##### registerFileUploadMethod 

```
/**
*/
registerFileUploadMethod([icon action text])
```

##### registerFilesWillUploadHook 

```
/**
*/
registerFilesWillUploadHook([hook])
```

##### unregisterComponent 

```
/**
*/
unregisterComponent([componentId])
```

##### unregisterPostTypeComponent 

```
/**
*/
unregisterPostTypeComponent([componentId])
```

##### registerReducer 

```
/**
*/
registerReducer([reducer])
```

##### registerWebSocketEventHandler 

```
/**
*/
registerWebSocketEventHandler([event handler])
```

##### unregisterWebSocketEventHandler 

```
/**
*/
unregisterWebSocketEventHandler([event])
```

##### registerReconnectHandler 

```
/**
*/
registerReconnectHandler([handler])
```

##### unregisterReconnectHandler 

```
/**
*/
unregisterReconnectHandler()
```

##### registerMessageWillBePostedHook 

```
/**
*/
registerMessageWillBePostedHook([hook])
```

##### registerSlashCommandWillBePostedHook 

```
/**
*/
registerSlashCommandWillBePostedHook([hook])
```

##### registerMessageWillFormatHook 

```
/**
*/
registerMessageWillFormatHook([hook])
```

##### registerFilePreviewComponent 

```
/**
*/
registerFilePreviewComponent([override component])
```

##### registerTranslations 

```
/**
*/
registerTranslations([getTranslationsForLocale])
```

##### registerAdminConsolePlugin 

```
/**
*/
registerAdminConsolePlugin([func])
```

##### unregisterAdminConsolePlugin 

```
/**
*/
unregisterAdminConsolePlugin()
```

##### registerAdminConsoleCustomSetting 

```
/**
*/
registerAdminConsoleCustomSetting([key component options])
```

##### registerAdminConsoleCustomSection 

```
/**
*/
registerAdminConsoleCustomSection([key component])
```

##### registerRightHandSidebarComponent 

```
/**
*/
registerRightHandSidebarComponent([component title showPopout])
```

##### registerNeedsTeamRoute 

```
/**
*/
registerNeedsTeamRoute([route component])
```

##### registerCustomRoute 

```
/**
*/
registerCustomRoute([route component])
```

##### registerProduct 

```
/**
*/
registerProduct([baseURL switcherIcon switcherText switcherLinkURL mainComponent headerCentreComponent headerRightComponent showTeamSidebar showAppBar wrapped publicComponent])
```

##### registerMessageWillBeUpdatedHook 

```
/**
*/
registerMessageWillBeUpdatedHook([hook])
```

##### registerSidebarChannelLinkLabelComponent 

```
/**
*/
registerSidebarChannelLinkLabelComponent([component])
```

##### registerSidebarBrowseOrAddChannelMenuAction 

```
/**
*/
registerSidebarBrowseOrAddChannelMenuAction([text action icon])
```

##### registerChannelTypeOption 

```
/**
*/
registerChannelTypeOption([label description icon isAvailable extraContent onCreate createButtonText])
```

##### registerChannelIconOverride 

```
/**
*/
registerChannelIconOverride([matcher iconName])
```

##### registerChannelComposerBannerComponent 

```
/**
*/
registerChannelComposerBannerComponent([component])
```

##### registerChannelIntro 

```
/**
*/
registerChannelIntro([matcher component])
```

##### registerPostHeaderComponent 

```
/**
*/
registerPostHeaderComponent([component])
```

##### registerComposerPlaceholder 

```
/**
*/
registerComposerPlaceholder([transform])
```

##### registerProductSwitcherMenuItem 

```
/**
*/
registerProductSwitcherMenuItem([text icon action isHidden])
```

##### registerChannelToastComponent 

```
/**
*/
registerChannelToastComponent([component])
```

##### registerGlobalComponent 

```
/**
*/
registerGlobalComponent([component])
```

##### registerAppBarComponent 

```
/**
*/
registerAppBarComponent([iconUrl action tooltipText supportedProductIds rhsComponent rhsTitle])
```

##### registerSiteStatisticsHandler 

```
/**
*/
registerSiteStatisticsHandler([handler])
```

##### registerDesktopNotificationHook 

```
/**
*/
registerDesktopNotificationHook([hook])
```

##### registerUserSettings 

```
/**
*/
registerUserSettings([setting])
```

##### registerSystemConsoleGroupTable 

```
/**
*/
registerSystemConsoleGroupTable([component])
```

##### registerRHSPluginPopoutListener 

```
/**
*/
registerRHSPluginPopoutListener([pluginId onPopoutOpened])
```

### Theme 

In Mattermost, users are able to set custom themes that change the color scheme of the UI. It’s important that plugins have access to a user’s theme so that they can set their styling to match and not look out of place.

Every pluggable component in the web app will have the theme object as a prop.

The colors are exposed via CSS variables as well.

The theme object has the following properties:

| Property                | CSS Variable                | Description                                                                         |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| sidebarBg               | –sidebar-bg                 | Background color of the left-hand sidebar                                           |
| sidebarText             | –sidebar-text               | Color of text in the left-hand sidebar                                              |
| sidebarUnreadText       | –sidebar-unread-text        | Color of text for unread channels in the left-hand sidebar                          |
| sidebarTextHoverBg      | –sidebar-text-hover-bg      | Background color of channels when hovered in the left-hand sidebar                  |
| sidebarTextActiveBorder | –sidebar-text-active-border | Color of the selected indicator channel indicator in the left-hand siebar           |
| sidebarTextActiveColor  | –sidebar-text-active-color  | Color of the text for the selected channel in the left-hand sidebar                 |
| sidebarHeaderBg         | –sidebar-header-bg          | Background color of the left-hand sidebar header                                    |
| sidebarHeaderTextColor  | –sidebar-header-text-color  | Color of text in the left-hand sidebar header                                       |
| onlineIndicator         | –online-indicator           | Color of the online status indicator                                                |
| awayIndicator           | –away-indicator             | Color of the away status indicator                                                  |
| dndIndicator            | –dnd-indicator              | Color of the do not disturb status indicator                                        |
| mentionBg               | –mention-bg                 | Background color for mention jewels in the left-hand sidebar                        |
| mentionColor            | –mention-color              | Color of text for mention jewels in the left-hand sidebar                           |
| centerChannelBg         | –center-channel-bg          | Background color of channels, right-hand sidebar and modals/popovers                |
| centerChannelColor      | –center-channel-color       | Color of text in channels, right-hand sidebar and modals/popovers                   |
| newMessageSeparator     | –new-message-separator      | Color of the new message separator in channels                                      |
| linkColor               | –link-color                 | Color of text for links                                                             |
| buttonBg                | –button-bg                  | Background color of buttons                                                         |
| buttonColor             | –button-color               | Color of text for buttons                                                           |
| errorTextColor          | –error-text                 | Color of text for errors                                                            |
| mentionHighlightBg      | –mention-highlight-bg       | Background color of mention highlights in posts                                     |
| mentionHighlightLink    | –mention-highlight-link     | Color of text for mention links in posts                                            |
| codeTheme               | NA                          | Code block theme, either ‘github’, ‘monokai’, ‘solarized-dark’ or ‘solarized-light’ |

## Exported libraries and functions 

The web app exposes a number of exported libraries and functions on the `window` object for plugins to use. To avoid bloating your plugin, we recommend depending on these using Webpack externals or importing them manually from the window. Below is a list of the exposed libraries and functions:

| Library         | Exported Name         | Description                                                        |
| --------------- | --------------------- | ------------------------------------------------------------------ |
| react           | window.React          | [ReactJS](https://react.dev/)                                      |
| react-dom       | window.ReactDOM       | [ReactDOM](https://react.dev/docs/react-dom.html)                  |
| redux           | window.Redux          | [Redux](https://redux.js.org/)                                     |
| react-redux     | window.ReactRedux     | [React bindings for Redux](https://github.com/reactjs/react-redux) |
| react-bootstrap | window.ReactBootstrap | [Bootstrap for React](https://react-bootstrap.github.io/)          |
| prop-types      | window.PropTypes      | [PropTypes](https://www.npmjs.com/package/prop-types)              |
| post-utils      | window.PostUtils      | Mattermost post utility functions (see below)                      |

**Note:**  
 Some sets of functions like “Functions exposed on window for plugin to use” and “Components exposed on window for internal plugin use only” are not listed here. You can refer to export.js file which contains all the exports.

#### post-utils 

Contains the following post utility functions:

##### `formatText(text, options)` 

Performs formatting of text including Markdown, highlighting mentions and search terms and converting URLs, hashtags, @mentions and \~channels to links by taking a string and returning a string of formatted HTML.

* `text` \- String of text to format, e.g. a post’s message.
* `options` \- (Optional) An object containing the following formatting options
* `searchTerm` \- If specified, this word is highlighted in the resulting HTML. Defaults to nothing.
* `mentionHighlight` \- Specifies whether or not to highlight mentions of the current user. Defaults to true.
* `mentionKeys` \- A list of mention keys for the current user to highlight.
* `singleline` \- Specifies whether or not to remove newlines. Defaults to false.
* `emoticons` \- Enables emoticon parsing with a data-emoticon attribute. Defaults to true.
* `markdown` \- Enables markdown parsing. Defaults to true.
* `siteURL` \- The origin of this Mattermost instance. If provided, links to channels and posts will be replaced with internal links that can be handled by a special click handler.
* `atMentions` \- Whether or not to render “@” mentions into spans with a data-mention attribute. Defaults to false.
* `channelNamesMap` \- An object mapping channel display names to channels. If `channelNamesMap` and `team` are provided, \~channel mentions will be replaced with links to the relevant channel.
* `team` \- The current team object.
* `proxyImages` \- If specified, images are proxied. Defaults to false.

##### `messageHtmlToComponent(html, isRHS, options)` 

Converts HTML to React components.

* `html` \- String of HTML to convert to React components.
* `isRHS` \- Boolean indicating if the resulting components are to be displayed in the right-hand sidebar. Has some minor effects on how UI events are triggered for components in the RHS.
* `options` \- (Optional) An object containing options
* `mentions` \- If set, mentions are replaced with the AtMention component. Defaults to true.
* `emoji` \- If set, emoji text is replaced with the PostEmoji component. Defaults to true.
* `images` \- If set, markdown images are replaced with the PostMarkdown component. Defaults to true.
* `latex` \- If set, latex is replaced with the LatexBlock component. Defaults to true.

##### Usage example 

A short usage example of a `PostType` component using the post utility functions to format text.

```jsx
import React from 'react'; // accessed through webpack externals
import PropTypes from 'prop-types';

const PostUtils = window.PostUtils; // must be accessed through `window`

export default class PostTypeFormatted extends React.PureComponent {

    // ...

    render() {
        const post = this.props.post;

        const formattedText = PostUtils.formatText(post.message); // format the text

        return (
            <div>
                {'Formatted text: '}
                {PostUtils.messageHtmlToComponent(formattedText)} // convert the html to components
            </div>
        );
    }
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