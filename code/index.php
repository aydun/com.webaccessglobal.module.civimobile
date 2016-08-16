<?php
if ( CRM_Utils_Array::value( 'locale', $GLOBALS ) ) {
  $civimobile_vars['language'] = $GLOBALS['locale'];
}
else {
  $civimobile_vars['language'] = 'en_US';
}

$civimobile_vars['title'] = 'CiviMobile';

$config =& CRM_Core_Config::singleton();
$civimobile_vars['civicrm_resourceURL'] = $config->userFrameworkResourceURL . DIRECTORY_SEPARATOR;

$session =& CRM_Core_Session::singleton();
$civimobile_vars['loggedInContactID'] = $session->get('userID');

// extension include path
$includePath = $config->extensionsURL . DIRECTORY_SEPARATOR . 'com.webaccessglobal.module.civimobile' . DIRECTORY_SEPARATOR;
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="<?php print $civimobile_vars['language'] ?>" lang="<?php print $civimobile_vars['language'] ?>" >
<head>
  <title><?php print $civimobile_vars['title'];?></title>
  <?php //print $civimobile_page_settings['favicon'] ?>
  <meta http-equiv="content-type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" >
  <link rel="stylesheet" href="<?php print $includePath;?>libraries/pure-min.css" />
  <link rel="stylesheet" href="<?php print $includePath;?>app/res/css.css" />
  <link rel="stylesheet" href="<?php print $includePath;?>app/res/icons.css" />
  <link rel="stylesheet" href="<?php print $includePath;?>app/res/ngdialog-theme.css" />
  <link rel="stylesheet" href="<?php print $includePath;?>libraries/ngDialog.min.css" />
  <script type="text/javascript" src="<?php print $includePath; ?>libraries/angular.min.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>libraries/angular-ui-router.min.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>libraries/ngDialog.min.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>libraries/ct-ui-router-extras.core.min.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>libraries/ct-ui-router-extras.transition.min.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>libraries/ct-ui-router-extras.previous.min.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>libraries/angular-vs-repeat.min.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/civimobile.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/apiService.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/controllers/home.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/controllers/contacts.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/controllers/contact.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/controllers/contribution.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/controllers/events.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/controllers/event.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/controllers/memberships.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/controllers/donations.js"></script>
  <script type="text/javascript" src="<?php print $includePath; ?>app/controllers/surveys.js"></script>
  <script type="text/javascript">
    // Define globally default profile ids that will be used when creating new
    // records.
    var defaultProfileIds = {
      'Individual': <?php echo civimobile::getProfileId('Individual'); ?>,
      'Organization': <?php echo civimobile::getProfileId('Organization'); ?>,
      'Household': <?php echo civimobile::getProfileId('Household'); ?>,
    };
    var userId = <?php print $civimobile_vars['loggedInContactID'];?>
  </script>
</head>
<body ng-app='civimobile'>
<?php if ( !CRM_Utils_System::isUserLoggedIn() ) {
  CRM_Utils_System::redirect(CRM_Utils_System::url('/user'));
  CRM_Utils_System::civiExit();
} ?>
<div id='header'>
  <a ui-sref='home'><img id='logo' class='icon' src='<?php print $includePath; ?>app/res/logo.png' /></a>
  <h3 ng-bind='$state.current.data.title'>CiviMobile</h3>
</div>
<div id='main' ui-view></div>
</body>
</html>
