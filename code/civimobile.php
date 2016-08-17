<?php
class civimobile {
  static public function home() {
    require_once 'index.php';
    exit;
  }

  static public function homePartial() {
    require_once 'partials/home.html';
    exit;
  }
  static public function contactsPartial() {
    require_once 'partials/contacts.html';
    exit;
  }
  static public function newContactDialog() {
    require_once 'partials/dialogs/new_contact.html';
    exit;
  }
  static public function contactGeoDialog() {
    require_once 'partials/dialogs/contact_geo_search.html';
    exit;
  }
  static public function contactPartial() {
    require_once 'partials/contact.html';
    exit;
  }
  static public function editContactPartial() {
    require_once 'partials/edit_contact.html';
    exit;
  }
  static public function newContactPartial() {
    require_once 'partials/new_contact.html';
    exit;
  }
  static public function contactFormPartial() {
    require_once 'partials/contact_form.html';
    exit;
  }
  static public function newContributionPartial() {
    require_once 'partials/new_contribution.html';
    exit;
  }
  static public function eventsPartial() {
    require_once 'partials/events.html';
    exit;
  }
  static public function eventPartial() {
    require_once 'partials/event.html';
    exit;
  }
  static public function editEventPartial() {
    require_once 'partials/edit_event.html';
    exit;
  }
  static public function eventAttendeesPartial() {
    require_once 'partials/event_attendees.html';
    exit;
  }
  static public function checkInParticipantDialog() {
    require_once 'partials/dialogs/check_in_participant.html';
    exit;
  }
  static public function newParticipantDialog() {
    require_once 'partials/dialogs/new_participant.html';
    exit;
  }
  static public function newMessageDialog() {
    require_once 'partials/dialogs/message.html';
    exit;
  }
  static public function membershipsPartial() {
    require_once 'partials/memberships.html';
    exit;
  }
  static public function membershipPartial() {
    require_once 'partials/membership.html';
    exit;
  }
  static public function editMembershipPartial() {
    require_once 'partials/edit_membership.html';
    exit;
  }
  static public function donationsPartial() {
    require_once 'partials/donations.html';
    exit;
  }
  static public function surveysPartial() {
    require_once 'partials/surveys.html';
    exit;
  }

  static public function contacts() {
    $action = $_GET['action'];
    if ( $action == 'view' ) {
      require_once 'civimobile.contact_view.html';
    }
    else {
      require_once 'civimobile.contact.html';
    }
    exit;
  }

  static public function surveyContacts() {
    require_once 'civimobile.survey_contacts.html';
    exit;
  }

  static public function surveyInterview() {
    require_once 'civimobile.survey_interview.html';
    exit;
  }

  static public function login() {
    require_once 'civimobile.login.html';
    exit;
  }

  static public function logout() {
    CRM_Utils_System::logout();
    CRM_Utils_System::redirect( CRM_Utils_System::url('civicrm/mobile') );
    CRM_Utils_System::civiExit();
  }

  static public function getProfileId($contact_type) {
    // Set variables based on contact type.
    if($contact_type == 'Individual') {
      $user_preference_key = 'ind_profile_id';
      $reserved_profile_name = 'new_individual';
      $default = 3;
    }
    elseif($contact_type == 'Organization') {
      $user_preference_key = 'org_profile_id';
      $reserved_profile_name = 'new_organization';
      $default = 4;
    }
    elseif($contact_type == 'Household') {
      $user_preference_key = 'house_profile_id';
      $reserved_profile_name = 'new_household';
      $default = 5;
    }
    // First try to get custom value set for this installation.
    $params = array(
      'name' => $user_preference_key,
      'group' => "CiviCRM Mobile",
    );
    try {
      $ret = civicrm_api3('Setting', 'getvalue', $params);
    }
    catch (CiviCRM_API3_Exception $e) {
      // What do we do with errors?
      $ret = False;
    }

    if(!empty($ret)) return $ret;

    // If we don't have a value, use the reserved profile
    $params = array(
      'return' => 'id',
      'name' => $reserved_profile_name,
    );
    try {
      $ret = civicrm_api3('uf_group', 'getvalue', $params);
    }
    catch (CiviCRM_API3_Exception $e) {
      // What do we do with errors?
      // Revert to hard coded ids
      $ret = $default;
    }
    if(!empty($ret)) return $ret;
    return $default;
  }
}
