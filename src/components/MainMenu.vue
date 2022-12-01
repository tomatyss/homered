<template>
  <div id="main_menu">
    <a
      href="#"
      class="ui-btn ui-btn-icon-left ui-icon-channel-new default-null"
      id="hr_create_channel"
      style="
        font-weight: normal;
        margin: 0;
        text-align: left;
        background-color: white !important;
      "
      >Create Group</a
    >
    <a
      href="#"
      class="ui-btn ui-btn-icon-left ui-icon-channel-new default-null"
      id="hr_create_channel"
      style="
        font-weight: normal;
        margin: 0;
        text-align: left;
        background-color: white !important;
      "
      >Create Group</a
    >
    <a
      href="#"
      class="ui-btn ui-btn-icon-left ui-icon-post"
      id="hr_create_post"
      style="
        font-weight: normal;
        margin: 0;
        text-align: left;
        background-color: white !important;
      "
      >New Post</a
    >
    <a
      href="#"
      id="hr_restore"
      class="ui-btn ui-btn-icon-left ui-icon-restore"
      style="font-weight: normal; margin: 0; text-align: left"
      >Restore data</a
    >
    <a
      href="#"
      id="hr_words"
      class="ui-btn ui-btn-icon-left ui-icon-words"
      style="display: none; font-weight: normal; margin: 0; text-align: left"
      >My access code</a
    >
    <a
      href="#"
      id="hr_help_sett"
      class="ui-btn ui-btn-icon-left ui-icon-help"
      style="font-weight: normal; margin: 0; text-align: left"
      >Reset Help</a
    >
    <a
      href="#"
      id="hr_about_btn"
      class="ui-btn ui-btn-icon-left ui-icon-info"
      style="font-weight: normal; margin: 0; text-align: left"
      >About</a
    >
    <a
      href="#"
      class="ui-btn ui-btn-icon-left ui-icon-feedback"
      style="font-weight: normal; margin: 0; text-align: left"
      >Feedback</a
    >
    <a
      href="#"
      class="ui-btn ui-btn-icon-left ui-icon-terms"
      style="font-weight: normal; margin: 0; text-align: left"
      >Terms</a
    >
    <a
      href="#"
      id="hr_donate_btn"
      class="ui-btn ui-btn-icon-left ui-icon-donate"
      style="font-weight: normal; margin: 0; text-align: left"
      >Donate</a
    >
  </div>
</template>

<script>
export default {
  data() {
    return {
      toggle: false,
    };
  },
  methods: {
    showMenu() {
      if ($("#hr_mnemonics").is(":visible")) {
        $("#hr_mnemonics, .hr-modal").hide();
      } else if ($("#hr_mnemonics_restore").is(":visible")) {
        $("#hr_mnemonics_restore, .hr-modal").hide();
      } else if (MenuOpen()) {
        hideMenu();
      } else {
        hideAbout();
        $("#hr_menu_btn")
          .removeClass("ui-icon-menu")
          .addClass("ui-icon-menu-active");
        $("#main_menu").show("slide:right");
        if (gViewMode) {
          closeHomred();
        } else {
          cancelCreateHomred();
        }
        if (!isDesktop()) {
          //if mobile
          closeHomred();
          hideChannels();
          $("#hr_search").hide();
        }
      }
    },
    hideMenu() {
      if (MenuOpen()) {
        $("#hr_menu_btn")
          .removeClass("ui-icon-menu-active")
          .addClass("ui-icon-menu");
        $("#main_menu").hide("slide:left");
        showSearch();
      }
    },
  },
};
</script>