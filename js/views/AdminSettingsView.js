'use strict';

var
	_ = require('underscore'),
	ko = require('knockout'),
	
	ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
	CAbstractSettingsFormView = ModulesManager.run('AdminPanelWebclient', 'getAbstractSettingsFormViewClass'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js')
;

/**
* @constructor
*/
function CAdminSettingsView()
{
	CAbstractSettingsFormView.call(this, Settings.ServerModuleName);
	
	/* Editable fields */
	this.enable = ko.observable(Settings.EnableModule);
	this.id = ko.observable(Settings.Id);
	this.secret = ko.observable(Settings.Secret);
	this.scopes = ko.observable(Settings.Scopes);
	/*-- Editable fields */
}

_.extendOwn(CAdminSettingsView.prototype, CAbstractSettingsFormView.prototype);

CAdminSettingsView.prototype.ViewTemplate = '%ModuleName%_AdminSettingsView';

CAdminSettingsView.prototype.getCurrentValues = function()
{
	return [
		this.enable(),
		this.id(),
		this.secret(),
		this.scopes()
	];
};

CAdminSettingsView.prototype.revertGlobalValues = function()
{
	this.enable(Settings.EnableModule);
	this.id(Settings.Id);
	this.secret(Settings.Secret);
	this.scopes(Settings.Scopes);
};

CAdminSettingsView.prototype.getParametersForSave = function ()
{
	return {
		'EnableModule': this.enable(),
		'Id': this.id(),
		'Secret': this.secret(),
		'Scopes': _.map(this.scopes(), function(oScope){
			return {
				Name: oScope.Name,
				Description: oScope.Description,
				Value: oScope.Value()
			};
		})
	};
};

CAdminSettingsView.prototype.applySavedValues = function (oParameters)
{
	Settings.updateAdmin(oParameters.EnableModule, oParameters.Id, oParameters.Secret, oParameters.Scopes);
};

CAdminSettingsView.prototype.setAccessLevel = function (sEntityType, iEntityId)
{
	this.visible(sEntityType === '');
};

module.exports = new CAdminSettingsView();
