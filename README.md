# CiviMobile extension

A web application exposing a few specific actions in CiviCRM in a mobile-friendly way. Note that it is not a mobile interface for all of CiviCRM.

### Features

Contacts

- Contacts can be searched for by name, email address, or phone number (the search field is automatically detected based on the input, but is overridable).
- Contacts can be searched for by location: either within a chosen radius of the current location or within a postal code.
- Contacts can be created, edited, and viewed.
- Multiple email addresses and phone numbers can be entered, and assigned as 'primary', 'billing', etc.
- The primary phone number for each contact can be dialled from the list of contacts; for those without phone numbers, their primary email address is substituted.

Events

- Organisers can view and edit descriptive fields such as address or date and time.
- Participants can be 'checked in' (i.e. toggled between 'Registered'/'Pay later' and 'Attended'). If a participant has a linked contribution which is pending as 'pay later' the organiser is prompted to collect it and mark the contribution as complete. If a participant has no linked contribution but has a 'pay later' state the organiser is prompted to collect payment and create a new contribution record.
- Contacts who aren't yet participants can be signed up to events (if the events are monetary, the participant status is set to 'pay later').

Memberships

- Organisations can sign up existing contacts for memberships, or create a new contact as part of the sign-up process.
- Members are searchable by name and email address, and the list of memberships distinguishes between each type ('Student', 'Lifetime', etc.).
- Membership type, end date, and source are editable.
- Each individual membership page lists contributions associated with that membership so that they can be edited (marked as complete, say); new membership payment contributions can be recorded.

Donations

- Campaigners can collect donations and create corresponding contribution records for either existing contacts (searchable as above) or new contacts.

### Installation

Requirements

- CiviCRM 4.6.x +

CiviMobile is a free and open source extension for CiviCRM that can be downloaded from the extensions directory.

### Configuration

The fields displayed and editable for each contact in CiviMobile are configured in CiviCRM profiles.

You can create a new profile in `Administer > Custom Data and Screens >   Profiles`, and choose which profile is used for each contact type in `Administer > Custom Data and Screens > CiviMobile`.

### Credit

Angular implementation built by [Adam Hillier](https://github.com/AdamHillier), working at [Compucorp](https://github.com/compucorp) for GSOC 2016.

[Previous JQuery implementation](https://github.com/webaccess/com.webaccessglobal.module.civimobile) built by:

- Web Access        - webaccessglobal.com
- Kurund Jalmi      - civicrm.org
- Peter McAndrew    - thirdsectordesign.org
- Erawat Chamanont
