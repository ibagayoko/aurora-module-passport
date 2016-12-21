<?php
/**
 * @copyright Copyright (c) 2016, Afterlogic Corp.
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License, version 3,
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
 * 
 * @package Modules
 */

class FacebookModule extends AApiModule
{
	protected $sService = 'facebook';
	
	protected $aSettingsMap = array(
		'EnableModule' => array(false, 'bool'),
		'Id' => array('', 'string'),
		'Secret' => array('', 'string')
	);
	
	protected $aRequireModules = array(
		'OAuthIntegratorWebclient'
	);
	
	protected function issetScope($sScope)
	{
		return in_array($sScope, explode(' ', $this->getConfig('Scopes')));
	}
	
	/***** private functions *****/
	/**
	 * Initializes FacebookAuthWebclient Module.
	 * 
	 * @ignore
	 */
	public function init()
	{
		$this->subscribeEvent('GetServicesSettings', array($this, 'onGetServicesSettings'));
		$this->subscribeEvent('UpdateServicesSettings', array($this, 'onUpdateServicesSettings'));
	}
	
	/**
	 * Adds service settings to array passed by reference.
	 * 
	 * @ignore
	 * @param array $aServices Array with services settings passed by reference.
	 */
	public function onGetServicesSettings(&$aServices)
	{
		$aSettings = $this->GetSettings();
		if (!empty($aSettings))
		{
			$aServices[] = $aSettings;
		}
	}
	
	/**
	 * Updates service settings.
	 * 
	 * @ignore
	 * @param array $aServices Array with new values for service settings.
	 * 
	 * @throws \System\Exceptions\AuroraApiException
	 */
	public function onUpdateServicesSettings($aServices)
	{
		$aSettings = $aServices[$this->sService];
		
		if (is_array($aSettings))
		{
			$this->UpdateSettings($aSettings['EnableModule'], $aSettings['Id'], $aSettings['Secret']);
		}
	}
	/***** private functions *****/
	
	/***** public functions might be called with web API *****/
	/**
	 * Obtaines list of module settings for authenticated user.
	 * 
	 * @return array
	 */
	public function GetSettings()
	{
		$aResult = array();
		\CApi::checkUserRoleIsAtLeast(\EUserRole::Anonymous);
		
		$oUser = \CApi::getAuthenticatedUser();
		if (!empty($oUser) && $oUser->Role === \EUserRole::SuperAdmin)
		{
			$aResult = array(
				'Name' => $this->sService,
				'DisplayName' => $this->GetName(),
				'EnableModule' => $this->getConfig('EnableModule', false),
				'Id' => $this->getConfig('Id', ''),
				'Secret' => $this->getConfig('Secret', '')
			);
		}
		
		if (!empty($oUser) && $oUser->Role === \EUserRole::NormalUser)
		{
			$oAccount = null;
			$oOAuthIntegratorWebclientDecorator = \CApi::GetModuleDecorator('OAuthIntegratorWebclient');
			if ($oOAuthIntegratorWebclientDecorator)
			{
				$oAccount = $oOAuthIntegratorWebclientDecorator->GetAccount($this->sService);
			}
			$aResult = array(
				'EnableModule' => $this->getConfig('EnableModule', false),
				'Connected' => $oAccount ? true : false
			);
			$aArgs = array(
				'OAuthAccount' => $oAccount
			);
			$this->broadcastEvent('GetSettings', $aArgs, $aResult);
		}
		
		
		return $aResult;
	}
	
	/**
	 * Updates service settings.
	 * 
	 * @param boolean $EnableModule **true** if module should be enabled.
	 * @param string $Id Service app identificator.
	 * @param string $Secret Service app secret.
	 * 
	 * @throws \System\Exceptions\AuroraApiException
	 */
	public function UpdateSettings($EnableModule, $Id, $Secret)
	{
		\CApi::checkUserRoleIsAtLeast(\EUserRole::TenantAdmin);
		
		try
		{
			$this->setConfig('EnableModule', $EnableModule);
			$this->setConfig('Id', $Id);
			$this->setConfig('Secret', $Secret);
			$this->saveModuleConfig();
		}
		catch (Exception $ex)
		{
			throw new \System\Exceptions\AuroraApiException(\System\Notifications::CanNotSaveSettings);
		}
		
		return true;
	}
	
	/**
	 * Deletes DropBox account.
	 * 
	 * @return boolean
	 */
	public function DeleteAccount()
	{
		\CApi::checkUserRoleIsAtLeast(\EUserRole::NormalUser);
		
		$bResult = false;
		$oOAuthIntegratorWebclientDecorator = \CApi::GetModuleDecorator('OAuthIntegratorWebclient');
		if ($oOAuthIntegratorWebclientDecorator)
		{
			$bResult = $oOAuthIntegratorWebclientDecorator->DeleteAccount($this->sService);
		}
		
		return $bResult;
	}
	/***** public functions might be called with web API *****/
}
