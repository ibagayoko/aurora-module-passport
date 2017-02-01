'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	Types = require('%PathToCoreWebclientModule%/js/utils/Types.js'),
	UrlUtils = require('%PathToCoreWebclientModule%/js/utils/Url.js'),
	
	Ajax = require('%PathToCoreWebclientModule%/js/Ajax.js'),
	Api = require('%PathToCoreWebclientModule%/js/Api.js'),
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	WindowOpener = require('%PathToCoreWebclientModule%/js/WindowOpener.js'),
	
	CAbstractSettingsFormView = ModulesManager.run('SettingsWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
* @constructor
*/
function CUserSettingsView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	this.connected = ko.observable(Settings.Connected);
	this.scopes = ko.observable(Settings.Scopes);
	this.bRunCallback = false;
	
	window.facebookConnectCallback = _.bind(function (bResult, sErrorCode, sModule) {
		this.bRunCallback = true;
		
		if (!bResult)
		{
			Api.showErrorByCode({'ErrorCode': Types.pInt(sErrorCode), 'ErrorMessage': '', 'ErrorModule': sModule}, '', true);
		}
		else
		{
			this.connected(true);
		}
	}, this);
}

_.extendOwn(CUserSettingsView.prototype, CAbstractSettingsFormView.prototype);

CUserSettingsView.prototype.ViewTemplate = '%ModuleName%_UserSettingsView';

/**
 * Tries to connect user to facebook account.
 */
CUserSettingsView.prototype.connect = function ()
{
	var aScopes = [];

	$.removeCookie('oauth-scopes');
	_.each(this.scopes(), function (oScope) {
		if (oScope.Value())
		{
			aScopes.push(oScope.Name);
		}
	});

	$.cookie('oauth-scopes', aScopes.join('|'));
	$.cookie('oauth-redirect', 'connect');
	var
		oWin = WindowOpener.open(UrlUtils.getAppPath() + '?oauth=facebook', 'Facebook'),
		iIntervalId = setInterval(_.bind(function() {
			if (oWin.closed)
			{
				if (!this.bRunCallback)
				{
					window.location.reload();
				}
				else
				{
					clearInterval(iIntervalId);
					App.broadcastEvent('OAuthAccountChange::after');
				}
			}
		}, this), 1000)
	;
};

/**
 * Disconnects user from facebook account.
 */
CUserSettingsView.prototype.disconnect = function ()
{
	if (App.isAccountDeletingAvaliable())
	{
		Ajax.send(Settings.ServerModuleName, 'DeleteAccount', null, function (oResponse) {
			if (oResponse.Result)
			{
				this.connected(false);
				_.each(this.scopes(), function (oScope) {
					oScope.Value(false);
				});
				App.broadcastEvent('OAuthAccountChange::after');
			}
			else
			{
				Api.showErrorByCode(oResponse, '', true);
			}
		}, this);
	}
};

module.exports = new CUserSettingsView();
