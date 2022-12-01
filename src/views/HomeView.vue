<script setup>
import MainMenu from "../components/MainMenu.vue";
import Header from "../components/Header.vue";
</script>

<template>
  <div data-role="page" id="P2" class="ui-responsive-panel">
    <div data-role="content">
      <Header />
      <MainMenu />

      <div id="hr_search">
        <fieldset class="ui-grid-a">
          <div class="ui-block-a" style="width: 12%">
            <!--<a href="#" id="hr_switch_search" class="ui-btn ui-btn-icon-notext ui-icon-find" style="width:100%;background-color:#f6f6f6">mode</a>-->
            <a
              href="#"
              id="hr_switch_search"
              data-hr-help="searchmode"
              class="ui-btn ui-btn-icon-notext ui-icon-find hr-popup-trigger"
              style="width: 97%; background-color: #f6f6f6"
            ></a>
          </div>
          <div class="ui-block-b" style="width: 88%">
            <div class="hr_search_events">
              <input
                type="search"
                autocomplete="off"
                id="events_search"
                data-hr-help="filterposts"
                class="hr_search_events hr-popup-trigger"
                placeholder="filter posts on map (4 characters min)"
                data-wrapper-class="controlgroup-textinput ui-btn"
              />
            </div>
            <div class="hr_search_place" style="display: none">
              <input
                type="search"
                autocomplete="off"
                id="place_search"
                data-hr-help="searchplace"
                class="hr_search_place hr-popup-trigger"
                style="display: none"
                data-clear-btn="true"
                placeholder="search places (4 characters min)"
                data-wrapper-class="controlgroup-textinput ui-btn"
              />
            </div>
          </div>
        </fieldset>
        <div id="filterposts" class="hr-popup">
          You can filter posts by key words in post titles. weblinks, emojis,
          group names.<br />Click<span
            class="ui-btn ui-btn-inline ui-btn-icon-notext ui-icon-find"
            style="background: transparent; padding: 0"
          ></span>
          switch to search places
        </div>
        <div id="searchplace" class="hr-popup">
          You can search for places and select from drop-down<br />Click<span
            class="ui-btn ui-btn-inline ui-btn-icon-notext ui-icon-find-place"
            style="background: transparent; padding: 0"
          ></span
          >to filter posts
        </div>
        <div id="searchmode" class="hr-popup">
          <b>Seach mode switch</b><br /><br />Click<span
            class="ui-btn ui-btn-inline ui-btn-icon-notext ui-icon-find"
            style="background: transparent; padding: 0"
          ></span
          >to switch to places searching mode<br />click<span
            class="ui-btn ui-btn-inline ui-btn-icon-notext ui-icon-find-place"
            style="background: transparent; padding: 0"
          ></span
          >to switch back to posts filtering mode
        </div>
        <ul
          id="hr_autocomplete_list"
          data-role="listview"
          data-inset="true"
          class="hr_search_place ui-mini"
          style="border-radius: 0; margin: 0; z-index: 7100"
        ></ul>
        <div id="hr_form_places" style="display: none">
          <a
            href="#"
            style="font-weight: normal; text-align: left; margin: 0"
            class="ui-btn"
            >choose from previous places below:</a
          >
          <ul
            id="hr_form_places_list"
            data-role="listview"
            data-inset="true"
            class="ui-mini"
            style="border-radius: 0; margin: 0"
          ></ul>
        </div>
      </div>

      <div id="hr_map"></div>
      
      <ul
        id="list-canvas"
        data-role="listview"
        class="hrnone"
        data-inset="true"
        style="display: none; margin: 0 -10px 0 -10px; overflow-y: auto"
        data-filter="true"
        data-input="#events_search"
      ></ul>

      <fieldset id="hr_date_ranges" class="ui-grid-b hr-date-ranges">
        <div class="ui-block-a"></div>
        <div class="ui-block-b">
          <div id="timeselect" class="hr-popup">Select time range</div>
          <ul data-role="listview" style="padding: 14px">
            <li class="hr-date-range" id="hr-day" data-hr-range="0">day</li>
            <!--<li class="hr-date-range" data-hr-range="1">week</li>-->
            <li class="hr-date-range" data-hr-range="2">month</li>
            <!--<li class="hr-date-range" data-hr-range="3">year</li>-->
            <li
              class="hr-date-range hr-date-range-active"
              id="hr-today"
              data-hr-range="4"
            >
              today
            </li>
          </ul>
        </div>
        <div class="ui-block-c"></div>
      </fieldset>

      <div id="timeback" class="hr-popup hr-date-ranges">Go back in time</div>
      <div id="timeforward" class="hr-popup hr-date-ranges">
        Go forward in time
      </div>

      <fieldset id="hr_time_selector" class="ui-grid-b">
        <div class="ui-block-a">
          <a
            href="#"
            class="
              ui-btn
              hr-date-change
              ui-btn-icon-left ui-icon-earlier
              hr-popup-trigger
            "
            data-hr-help="timeback"
            data-hr-direction="-1"
            style="
              margin: 0;
              padding-left: 1px;
              padding-right: 15px;
              font-weight: normal;
              text-align: right;
            "
            >earlier</a
          >
        </div>
        <div class="ui-block-b">
          <a
            id="hr_period"
            href="#"
            class="ui-btn hr-popup-trigger"
            data-hr-help="timeselect"
            style="
              margin: 0;
              padding-left: 1px;
              padding-right: 1px;
              font-weight: normal;
            "
            >date range</a
          >
        </div>
        <div class="ui-block-c">
          <a
            href="#"
            class="
              ui-btn
              hr-date-change
              ui-btn-icon-right ui-icon-later
              hr-popup-trigger
            "
            data-hr-help="timeforward"
            data-hr-direction="1"
            style="
              margin: 0;
              padding-left: 15px;
              padding-right: 1px;
              font-weight: normal;
              text-align: left;
            "
            >later</a
          >
        </div>
      </fieldset>

      <fieldset id="homred_details" class="hr-semitransparent">
        <fieldset
          class="ui-grid-c"
          style="padding: 5px; background-color: #f1f1f1"
        >
          <div class="ui-block-a" style="width: 10%">
            <span id="homred_details_favicon"></span>
          </div>
          <div class="ui-block-b" style="width: 70%">
            <div id="homred_details_channel" style="margin-top: 3px">group</div>
          </div>
          <div class="ui-block-c" style="width: 10%">
            <a
              href="#"
              id="hr_chann"
              class="
                default-null
                ui-btn
                ui-icon-channel
                ui-btn-inline
                ui-nodisc-icon
                ui-btn-icon-notext
              "
              style="
                background-color: transparent !important;
                margin: 0 !important;
              "
            ></a>
          </div>
          <div class="ui-block-d" style="width: 7%">
            <a
              href="#"
              class="hr-close ui-btn ui-btn-icon-notext ui-icon-delete"
              style="
                background-color: transparent;
                border-color: transparent;
                margin: 0;
              "
            ></a>
          </div>
        </fieldset>
        <div id="homred_emojis" style="margin: 8px"></div>
        <fieldset
          class="ui-grid-a"
          style="font-weight: bold; margin: 8px 8px 0 8px"
        >
          <div class="ui-block-a" style="width: 100%; overflow: hidden">
            <span
              id="homred_details_link"
              class="hr-nowrap hr-transition"
              style="
                display: none;
                text-decoration: none;
                color: #646464;
                overflow: hidden;
              "
              >link</span
            >
          </div>
          <div class="ui-block-b" style="width: 0%">
            <span
              id="homred_details_link_wrap"
              data-hr-wrap="homred_details_link"
              style="
                display: none;
                background: transparent;
                margin: -5px 0 0 10px;
              "
              class="ui-btn ui-btn-icon-notext ui-icon-wrap"
              >wrap</span
            >
          </div>
        </fieldset>
        <fieldset class="ui-grid-a">
          <div
            class="ui-block-a"
            style="width: auto; overflow: hidden; margin: 9px 8px 8px 8px"
          >
            <a
              id="homred_details_domain"
              class="hr-reaction"
              data-hr-action="7"
              style="display: none; font-weight: normal; text-decoration: none"
              >domain</a
            >
          </div>
          <div class="ui-block-b" style="width: auto">
            <a
              href="#"
              id="hr_viewed"
              style="
                display: none;
                padding-top: 10px;
                padding-left: 35px;
                background: transparent;
              "
              class="hr-action ui-btn ui-icon-7 ui-nodisc-icon ui-btn-icon-left"
              >0</a
            >
          </div>
        </fieldset>
        <div id="homred_details_time" style="margin: 0 8px 8px 8px">time</div>
        <div style="margin: 0 8px">
          <a
            id="homred_details_place"
            style="font-weight: normal; text-decoration: none"
            >place</a
          >
        </div>

        <div id="homred_details_control_block" style="margin: 0">
          <fieldset class="ui-grid-e">
            <div class="ui-block-a" style="width: 20%">
              <a
                href="#"
                data-hr-action="2"
                id="hr_like"
                class="
                  hr-action hr-reaction
                  ui-btn ui-icon-2 ui-nodisc-icon ui-btn-icon-left
                "
                >0</a
              >
            </div>
            <div class="ui-block-b" style="width: 20%">
              <a
                href="#"
                id="hr_dislike"
                class="ui-btn ui-icon-3 ui-nodisc-icon ui-btn-icon-left"
                >0</a
              >
            </div>
            <div class="ui-block-c" style="width: 20%">
              <a
                href="#"
                data-hr-action="6"
                id="hr_share"
                class="
                  hr-action hr-reaction
                  ui-btn
                  hr-invite
                  ui-icon-6 ui-nodisc-icon ui-btn-icon-left
                "
                >0</a
              >
            </div>
            <div class="ui-block-d" style="width: 20%">
              <a
                href="#"
                data-hr-action="11"
                id="hr_notif"
                class="
                  hr-action
                  ui-btn ui-icon-11 ui-nodisc-icon ui-btn-icon-left
                "
                >0</a
              >
            </div>
            <div class="ui-block-e" style="width: 20%">
              <a
                href="#"
                id="hr_discuss_button"
                class="hr-action ui-btn ui-icon-comment ui-btn-icon-left"
                >0</a
              >
            </div>
          </fieldset>
          <div id="discuss_port_homred"></div>
          <div id="dislike_port_homred"></div>
          <a
            href="#"
            id="hr_going"
            data-hr-action="4"
            style="width: 100%"
            class="hr-reaction hr-going ui-btn ui-btn-inline ui-btn-noicon"
            >Going 0</a
          >
          <fieldset class="ui-grid-b hr-owner">
            <div class="ui-block-a" style="width: 33%">
              <a
                href="#"
                data-hr-action="8"
                id="hr_duplicate"
                class="
                  ui-icon-top
                  ui-btn
                  ui-icon-duplicate
                  ui-nodisc-icon
                  ui-btn-icon-top
                "
                >Create similar</a
              >
            </div>
            <div class="ui-block-b" style="width: 33%">
              <a
                href="#"
                data-hr-action="15"
                id="hr_edit"
                class="
                  ui-icon-top ui-btn ui-icon-edit ui-nodisc-icon ui-btn-icon-top
                "
                >Edit</a
              >
            </div>
            <div class="ui-block-c" style="width: 33%">
              <a
                href="#"
                data-hr-action="14"
                id="hr_del"
                class="
                  ui-icon-top
                  ui-btn
                  ui-icon-remove
                  ui-nodisc-icon
                  ui-btn-icon-top
                "
                >Delete post</a
              >
            </div>
          </fieldset>
        </div>
      </fieldset>

      <div id="homred_form" data-role="controlgroup" class="hr-semitransparent">
        <a
          href="#"
          id="hr_new_post"
          class="ui-btn ui-btn-icon-left ui-icon-post"
          style="margin: 0; background: transparent"
          >New Post</a
        >
        <a
          href="#"
          id="hr_edit_post"
          class="ui-btn ui-btn-icon-left ui-icon-edit"
          style="margin: 0; background: transparent; display: none"
          >Edit Post</a
        >
        <a
          href="#"
          id="hr_copy_post"
          class="ui-btn ui-btn-icon-left ui-icon-duplicate"
          style="margin: 0; background: transparent; display: none"
          >Copy Post</a
        >
        <a
          href="#"
          id="homred_form_cancel"
          class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
        ></a>
        <fieldset
          class="default-null ui-grid-a"
          style="padding: 5px; background-color: #f1f1f1"
        >
          <div class="ui-block-a" style="width: 10%">
            <span id="homred_form_channel_favicon"></span>
          </div>
          <div class="ui-block-b" style="width: 90%">
            <div id="homred_form_channel_name" style="margin-top: 3px">
              group
            </div>
          </div>
        </fieldset>
        <div
          style="
            display: none;
            margin: 0;
            color: black;
            text-decoration-line: none;
            font-weight: normal;
            text-align: left;
          "
          class="ui-btn hr-uri-title"
        >
          Add weblink (optional)
        </div>
        <input
          type="url"
          placeholder="Add weblink to event"
          data-clear-btn="true"
          data-wrapper-class="controlgroup-textinput ui-btn"
          class="hr-uri"
          style="margin: 0 !important"
        />
        <!--<input type='textarea' id='homred_form_emoji' placeholder='Add emoji 😀 to show on map' data-clear-btn='true' data-wrapper-class="controlgroup-textinput ui-btn" style="margin:0 !important">-->
        <textarea
          readonly
          id="homred_form_emoji"
          style="display: none"
        ></textarea>
        <div
          id="homred_form_place_name"
          class="hr-going-active"
          style="padding: 10px"
        >
          select place (click on map or find place)
        </div>
        <div
          data-role="collapsible"
          id="homred_form_times"
          style="display: none"
          class="hr_new_class hr-large"
          data-collapsed-icon="hr-datetime"
          data-expanded-icon="hr-datetime"
        >
          <h3 id="homred_form_time_header">
            <a
              href="#"
              id="homred_form_time"
              class="ui-btn ui-nodisc-icon ui-btn-icon-right hr-going"
              style="font-weight: normal; padding-left: 0"
              >select time</a
            >
          </h3>
          <a
            id="homred_form_time_now"
            href="#"
            style="font-weight: normal; text-align: left"
            class="ui-btn"
            >now</a
          >
          <a
            href="#"
            style="font-weight: normal; text-align: left; font-size: small"
            class="ui-btn"
            >or choose start and (optional) end times:</a
          >
          <div id="homred_form_time_input">
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 30%">
                <label
                  class="ui-btn"
                  style="font-weight: normal; text-align: left"
                  >Start</label
                >
              </div>
              <div class="ui-block-b" style="width: 70%">
                <input
                  type="datetime-local"
                  id="homred_form_from"
                  class="hr_date_time"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  step="300"
                />
              </div>
            </fieldset>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 30%">
                <label
                  style="font-weight: normal; text-align: left"
                  class="ui-btn"
                  >End</label
                >
              </div>
              <div class="ui-block-b" style="width: 70%">
                <input
                  type="datetime-local"
                  id="homred_form_to"
                  class="hr_date_time"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  step="300"
                />
              </div>
            </fieldset>
          </div>
        </div>
        <a
          href="#"
          id="homred_form_post"
          style="display: none"
          class="hr-going-active ui-btn ui-btn-noicon"
          >Save post</a
        >
      </div>

      <div
        id="discuss_menu"
        class="ui-mini"
        style="display: none; padding-left: 5px"
      >
        <ul
          id="hr_fav_list"
          data-role="listview"
          style="margin: 0"
          data-filter="true"
          data-input="#members_filter"
        ></ul>
      </div>

      <div
        id="dislike_menu"
        class="ui-mini"
        style="display: none; padding-left: 5px"
      >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="42"
          >Misleading or false <span>0</span></a
        >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="43"
          >Scam <span>0</span></a
        >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="44"
          >Inappropriate <span>0</span></a
        >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="45"
          >Offensive <span>0</span></a
        >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="46"
          >Violence <span>0</span></a
        >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="47"
          >Illegal <span>0</span></a
        >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="48"
          >Spam <span>0</span></a
        >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="67"
          >Intellectual property misuse <span>0</span></a
        >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="68"
          >Request removal <span>0</span></a
        >
        <a
          href="#"
          class="ui-btn ui-btn-noicon-left hr-action hr-reaction hr-dislike"
          data-hr-action="3"
          >Just dislike <span>0</span></a
        >
      </div>

      <div id="hr_messages" style="padding: 0">
        <a
          href="#"
          id="hr_messages_nickname"
          class="ui-btn ui-btn-icon-left ui-icon-member hr-popup-trigger"
          data-hr-help="messages"
          style="margin: 0; background: transparent"
          >Nickname</a
        >
        <a
          href="#"
          id="hr_messages_close"
          class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
        ></a>
        <div id="messages" class="hr-popup">
          Chat privately to a specific group member (secure)
        </div>
        <input
          type="search"
          id="hr_messages_filter"
          data-wrapper-class="controlgroup-textinput ui-btn"
          placeholder="search messages"
        />
        <ul
          id="hr_messages_list"
          data-role="listview"
          style="margin: 0 0 1em 0"
          data-filter="true"
          data-input="#hr_messages_filter"
        ></ul>
        <!--<div id="hr_flowchat"></div>	-->
        <input
          type="text"
          id="hr_new_message"
          data-clear-btn="true"
          data-wrapper-class="controlgroup-textinput ui-btn"
          placeholder="new message"
        />
        <a
          href="#"
          id="hr_message_send"
          class="ui-btn ui-btn-noicon ui-icon-member"
          style="margin: 0; background: transparent"
          >Send</a
        >
      </div>

      <div id="hr_modal" class="hr-modal">
        <!-- Modal content -->

        <div id="channel_form_edit">
          <a
            href="#"
            id="hr_create_channel_text"
            class="ui-btn ui-btn-icon-left ui-icon-channel-new"
            style="margin: 0; background: transparent"
            >New Group</a
          >
          <a
            href="#"
            id="hr_edit_channel_text"
            class="ui-btn ui-btn-icon-left ui-icon-edit"
            style="margin: 0; background: transparent; display: none"
            >Edit Group</a
          >
          <a
            href="#"
            id="hr_cancel_create_channel"
            class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
          ></a>
          <fieldset
            data-role="controlgroup"
            style="margin: 0"
            class="default-null"
          >
            <!--<input type="radio" name="hr_channnel_type" id="hr_channnel_type_1" value="1" class="hr-channeltype-sel hr-popup-trigger" data-hr-help="channeltype1"><label for="hr_channnel_type_1" style="font-weight:normal">Premium channel</label>
			<div id="channeltype1" class="hr-popup">Premium channel posts are visible to all users by default. Post duration can be up to a week. Premium channel name can be shorter than other channel types (6 characters min). You can change a premium channel to other channel types.</div>-->
            <input
              type="radio"
              name="hr_channnel_type"
              id="hr_channnel_type_3"
              value="3"
              class="hr-channeltype-sel hr-popup-trigger"
              data-hr-help="channeltype3"
            /><label for="hr_channnel_type_3" style="font-weight: normal"
              >Public channel</label
            >
            <div id="channeltype3" class="hr-popup">
              Public channels and their posts are visible by all. Only you, as
              the channel creator, can post to the public channel. You can
              convert a public channel to private at any time.
            </div>
            <input
              type="radio"
              name="hr_channnel_type"
              id="hr_channnel_type_4"
              value="4"
              class="hr-channeltype-sel hr-popup-trigger"
              data-hr-help="channeltype4"
            /><label for="hr_channnel_type_4" style="font-weight: normal"
              >Private channel</label
            >
            <div id="channeltype4" class="hr-popup">
              For specific people by invite. Others cannot find or view private
              channel posts. All invited members can post to a private chanel.
              You can convert your private channel to public at any time.
            </div>
          </fieldset>
          <fieldset class="ui-grid-a">
            <div class="ui-block-a" style="width: 0">
              <span
                id="hr_new_channel_favicon"
                style="padding: 0"
                class="ui-btn hr_channel_ch"
              ></span>
            </div>
            <div class="ui-block-b" style="width: 90%">
              <input
                type="text"
                id="hr_new_channel_name"
                class="hr-popup-trigger"
                data-hr-help="channelname"
                data-clear-btn="true"
                data-wrapper-class="controlgroup-textinput"
                placeholder="Group name"
              />
            </div>
          </fieldset>
          <div id="channelname" class="hr-popup">
            Group name, prospective group members can easily associate with the
            topic of the group. At least 7 characters.
          </div>
          <!--<span id='hr_channel_link_help' class="ui-btn hr_channel_ch ui-mini" style="text-align:left;white-space:normal;padding:10px;color:#6d6d6d">Webpage about what you do or events you organise that you want to appear on the map via this channel.</span>-->
          <a
            href="#"
            id="hr_new_channel_uri_title"
            class="ui-btn hr_channel_ch hr-uri-title"
            style="display: none; text-align: left; padding-left: 0.5em"
          ></a>
          <input
            type="url"
            id="hr_new_channel_uri"
            class="hr-popup-trigger hr-uri"
            data-hr-help="channelweb"
            placeholder="Group webpage"
            data-clear-btn="true"
            data-wrapper-class="controlgroup-textinput"
          />
          <div id="channelweb" class="hr-popup">
            Webpage about what you do/events you organise (optional). We will
            try to automatically get the logo from your webpage, to become your
            group logo. Posts you create will display this logo on the map.
          </div>
          <!--<span id='hr_channel_favicon_help' class="ui-btn hr_channel_ch ui-mini" style="text-align:left;white-space:normal;padding:10px;color:#6d6d6d">Emoji to display on map for your posts/events</span>-->
          <input
            type="text"
            id="hr_new_channel_emoji"
            class="hr-popup-trigger"
            data-hr-help="channelemoji"
            placeholder="Emoji"
            data-clear-btn="true"
            data-wrapper-class="controlgroup-textinput"
          />
          <div id="channelemoji" class="hr-popup">
            If you don't have a webpage, or we could not obtain your logo from
            the webpage, you can pickup an emoji to show on map instead (use
            your device standard keyboard's emojis 😀; do not enter text)
          </div>
          <!--<span id='hr_tag_help' class="ui-btn hr_channel_ch ui-mini" style="text-align:left;white-space:normal;padding:10px;color:#6d6d6d">Pick pre-defined #tags to categorise channel content. This will help people find your channel.</span>-->
          <input
            type="text"
            id="tag_form_search"
            class="hr-popup-trigger"
            data-hr-help="channeltags"
            placeholder="Group tags"
            data-clear-btn="true"
            data-wrapper-class="controlgroup-textinput"
          />
          <div id="channeltags" class="hr-popup">
            Tags to categorise group posts
          </div>
          <ul
            id="tag_form_search_list"
            data-role="listview"
            style="border-radius: 0; margin: 0 !important"
            data-inset="true"
          ></ul>
          <div
            id="tag_form_selected"
            class="ui-mini"
            style="margin: 0; padding: 0.7m"
          ></div>
          <a
            id="channel_form_save"
            href="#"
            class="ui-btn ui-btn-noicon hr-going-active"
            >Save group</a
          >
          <span id="channel_name_exists" style="display: none" class="ui-btn"
            >name already taken</span
          >
        </div>

        <div id="hr_terms_text" class="hr-modal-content">
          <div style="height: 15px">
            <a
              href="#"
              class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
              onclick="toggleTerms(); void(0);"
            ></a>
          </div>
          <div class="unsel" style="padding: 10px">
            HOM.RED Terms of Service
            <br />
            <br />
            Last modified: 28 May 2018
            <br />
            <br />
            By using our Services, you are agreeing to these terms. Please read
            them carefully.
            <br />
            <br />
            HOM.RED PRIVACY POLICY:
            <br />
            <br />
            HOM.RED does not collect or process personal data. HOM.RED never
            asks you for personal data, whether yours, or other persons'
            including, but not limited to, personal names, emails, dates of
            birth, etc. By using HOM.RED you agree that a). any information that
            you provide to HOM.RED is public, b). you are solely responsible for
            ensuring that you do not provide personal or sensitive data to
            HOM.RED, c). HOM.RED cannot accept any liabiity for any personal or
            sensitive data that you may accidentally or knowingly provide to
            HOM.RED.
            <br />
            HOM.RED does not identify users. HOM.RED does not have a concept of
            an identifiable user. There are no session cookies that could
            identify or track users. All information that could directly or
            indirectly identify a user is stored only on the user's mobile phone
            or computer and is never transmitted to HOM.RED servers. HOM.RED may
            only receive personal information, which is already public, like a
            link (URL) to a website that a user wants to save to HOM.RED, or
            information that a user intentionally wants to be made public, like
            the name of a group created by the user. But any public information
            stored in HOM.RED servers, like the name of a website blog's author,
            cannot be linked with any other information stored on HOM.RED
            servers. This is because any data sent to HOM.RED servers from the
            user's mobile phone or computer is anonymous consisting of
            meaningless code that can never be attributed or linked to a user or
            to any public information stored on HOM.RED servers.
            <br />
            Becasue HOM.RED servers do not receive any information or data that
            may identify users (the names of groups, favourite links, favourite
            places, favourite areas) such information has to be saved on the
            user's mobile phone or computer to enable HOM.RED functionality.
            That is why HOM.RED has to use web storage for saving this
            information for the user. This storage or access is strictly
            necessary for the provision of an information service requested by
            the user.
            <br />
            Third Parties
            <br />
            HOM.RED relies on Cloudflare to provide infrastructure services
            (DNS, DDoS protection, etc.) to enable secure and reliable operation
            of HOM.RED website. The __cf_bm cookie is placed by Cloudflare and
            is strictly necessary for supporting Cloudflare's security features
            (detect malicious visitors to HOM.RED websites, minimize blocking
            legitimate users, etc.) The __cf_bm cookie collects and anonymises
            users' IP addresses using a one-way hash of certain values so they
            cannot be personally identified. The cookie is a session cookie that
            expires after 30 days. The __cf_bm cookie does not allow for
            cross-site tracking, does not follow users from site to site by
            merging various __cf_bm identifiers into a profile, does not
            correspond, or linked, to any user in HOM.RED web application.
            Cloudflare technical logs may contain IP addresses of HOM.RED users
            for the purpose of identifying malicious actors, but HOM.RED servers
            do not receive or store such logs. HOM.RED servers do not receive or
            store HOM.RED users' IP addresses.
            <br />
            <br />
            User Supplied Content:
            <br />
            <br />
            HOM.RED services may be used for lawful purposes only. Via HOM.RED's
            services, public users (Customers) may post links to any web
            resources, which will then be accessible to any other public users.
            The Customer must not post any defamatory, inaccurate, abusive,
            obscene, infringing, or threatening content. In addition, the
            Customer must not post any content that violates any US Federal,
            State, or local law. The Customer is solely responsible for such
            content made accessible through HOM.RED. In addition, the Customer
            may not use HOM.RED services to assist any other person or entity in
            violating any Federal, State, or local laws.
            <br />
            <br />
            Copyright Infringement:
            <br />
            <br />
            It is HOM.RED's policy to respond to notices of alleged infringement
            that comply with the Digital Millennium Copyright Act
            (http://www.copyright.gov/legislation/dmca.pdf) and other applicable
            intellectual property laws, which may include removing or disabling
            access to material claimed to be the subject of infringing activity.
            If we remove or disable access to comply with the Digital Millennium
            Copyright Act, we will make a good-faith attempt to contact the
            owner or administrator of each affected site so that they may make a
            counter notification pursuant to sections 512(g)(2) and (3) of that
            Act.
            <br />
            <br />
            Illegal Use:
            <br />
            <br />
            HOM.RED servers may be used for lawful purposes only. Transmission,
            storage, or distribution of any information, data, or material in
            violation of any applicable law or regulation, or that may directly
            facilitate the violation of any particular law or regulation is
            prohibited. This includes, but is not limited to: copyrighted
            material; trademarks; trade secrets or other intellectual property
            rights used without proper authorization; material that is obscene,
            defamatory, constitutes an illegal threat, or violates export
            control laws. Examples of unacceptable content or links include:
            pirated software, hacker programs or archives, Warez sites, MP3, and
            IRC bots.
            <br />
            <br />
            These Terms of Service apply to all users of the HOM.RED Service.
            Information provided by public through the HOM.RED Service contain
            links to third party websites that are not owned or controlled by
            HOM.RED. HOM.RED has no control over, and assumes no responsibility
            for, the content, privacy policies, or practices of any third party
            websites. In addition, HOM.RED will not and cannot censor or edit
            the content of any third-party site. By using the Service, you
            expressly acknowledge and agree that HOM.RED shall not be
            responsible for any damages, claims or other liability arising from
            or related to your use of any third-party website.
          </div>
        </div>

        <div id="hr_mnemonics" class="hr-modal-content">
          <a
            href="#"
            class="ui-btn ui-btn-icon-left ui-icon-words"
            style="margin: 0; background: transparent"
            >My access code</a
          >
          <span
            class="ui-btn"
            style="
              text-align: left;
              white-space: normal;
              font-weight: normal;
              background: white;
              margin: 0;
              padding-right: 1.8em;
              padding-bottom: 0;
            "
            >Data that identify you never leaves your device (except weblinks
            you post, which may have publicly available information). That is
            why homred generated 12 words that are your only way to restore your
            groups or other data. WRITE THEM DOWN IN THE SAME ORDER AND KEEP IN
            A SECURE PLACE. NEVER SAVE THEM IN YOUR PHONE OR COMPUTER. Press
            "Ok" to confirm you have written down your 12 words. They are the
            only key to your data, if you need to resore it.</span
          >
          <a
            href="#"
            id="hr_mnemonics_close"
            class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
          ></a>
          <ol
            data-role="listview"
            id="hr_mnemonics_list"
            style="margin: 20px"
          ></ol>
          <a
            href="#"
            id="hr_mnemonics_copy"
            class="hr-going ui-btn ui-btn-noicon"
            >Copy the words</a
          >
          <a
            href="#"
            id="hr_mnemonics_confirm"
            class="hr-going-active ui-btn ui-btn-noicon"
            >Ok and don't show again</a
          >
        </div>

        <div id="hr_mnemonics_restore" class="hr-modal-content">
          <a
            href="#"
            class="ui-btn ui-btn-icon-left ui-icon-restore"
            style="margin: 0; background: transparent"
            >Restore data</a
          >
          <span
            class="ui-btn"
            style="
              text-align: left;
              white-space: normal;
              font-weight: normal;
              background: white;
              margin: 0;
              padding-right: 1.8em;
              padding-bottom: 0;
            "
            >Enter 12 words in correct order (case insensitive) and press
            "Restore my data"</span
          >
          <a
            href="#"
            id="hr_mnemonics_restore_close"
            class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
          ></a>
          <div id="hr_mnemonics_enter_list" style="margin: 15px">
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>1</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w1"
                  data-hr-word="1"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 1"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list1"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w1"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>2</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w2"
                  data-hr-word="2"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 2"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list2"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w2"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>3</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w3"
                  data-hr-word="3"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 3"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list3"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w3"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>4</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w4"
                  data-hr-word="4"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 4"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list4"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w4"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>5</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w5"
                  data-hr-word="5"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 5"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list5"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w5"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>6</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w6"
                  data-hr-word="6"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 6"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list6"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w6"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>7</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w7"
                  data-hr-word="7"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 7"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list7"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w7"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>8</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w8"
                  data-hr-word="8"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 8"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list8"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w8"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>9</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w9"
                  data-hr-word="9"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 9"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list9"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w9"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>10</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w10"
                  data-hr-word="10"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 10"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list10"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w10"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>11</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w11"
                  data-hr-word="11"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 11"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list11"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w11"
              class="word-list"
            ></ul>
            <fieldset class="ui-grid-a">
              <div class="ui-block-a" style="width: 10%; padding-top: 10px">
                <span>12</span>
              </div>
              <div class="ui-block-b" style="width: 90%">
                <input
                  type="text"
                  id="hr_w12"
                  data-hr-word="12"
                  data-type="search"
                  class="hr-words"
                  data-clear-btn="true"
                  data-wrapper-class="controlgroup-textinput ui-btn"
                  placeholder="word 12"
                />
              </div>
            </fieldset>
            <ul
              id="hr_word_list12"
              data-role="listview"
              data-filter="true"
              data-filter-reveal="true"
              data-input="#hr_w12"
              class="word-list"
            ></ul>
          </div>
          <div
            id="hr_mnemonics_enter_string"
            style="margin: 15px; display: none"
          >
            <textarea
              id="hr_mnemonics_string"
              placeholder="Enter your 12 words separated by spaces"
              style="box-shadow: none; padding: 10px"
            ></textarea>
          </div>
          <a
            href="#"
            id="hr_mnemonics_enter_mode"
            class="hr-going ui-btn ui-btn-noicon"
            >Or, enter words as one string</a
          >
          <a
            href="#"
            id="hr_mnemonics_restore_confirm"
            class="hr-going-active ui-btn ui-btn-noicon"
            >Restore my data</a
          >
        </div>

        <div id="hr_feedback" class="hr-modal-content unsel">
          <a
            href="#"
            class="ui-btn ui-btn-icon-left ui-icon-feedback"
            style="margin: 0; background: transparent"
            >Feedback</a
          >
          <p style="margin: 10px">
            Your opinion is important. You can let us know what you think.
          </p>
          <a
            href="#"
            id="hr_cancel_feedback"
            class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
          ></a>
          <textarea
            id="hr_feedback_text"
            placeholder="Type your message (10 characters minimum)"
            style="box-shadow: none; padding: 10px"
          ></textarea>
          <a
            href="#"
            id="hr_save_feedback"
            class="ui-btn ui-btn-noicon hr-going"
            style="
              margin: 0;
              padding-left: 1px;
              padding-right: 1px;
              font-weight: normal;
            "
            >Send</a
          >
        </div>

        <div id="hr_about" class="hr-modal-content unsel">
          <a
            href="#"
            id="hr_about_close"
            class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
          ></a>
          <div style="margin: 1em">
            <h3>This is homred</h3>
            <p><b>Find</b> events and other content by place and time</p>
            <p>
              <b>Create</b> groups to show your events on map and promote your
              brand
            </p>
            <p>No personal data collected</p>
            <p>No ads</p>
            <p>Explore and enjoy!</p>
          </div>
              <input
            type="checkbox"
            name="hr_no_splash"
            id="hr_no_splash"
            data-mini="true"
          />
              <label for="hr_no_splash">Don't show again</label>
        </div>

        <div id="hr_alert" class="hr-modal-content unsel">
          <a
            href="#"
            id="hr_alert_close"
            class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
          ></a>
          <h5
            id="hr_alert_text"
            class="dont-break-out"
            style="margin: 1em; font-weight: normal"
          ></h5>
              <a
            href="#"
            id="hr_alert_ok"
            class="hr-going-active ui-btn ui-btn-noicon"
            >Ok</a
          >
        </div>

        <div id="hr_donate" class="hr-modal-content unsel">
          <a
            href="#"
            class="ui-btn ui-btn-icon-left ui-icon-donate"
            style="margin: 0; background: transparent"
            >Donate</a
          >
          <a
            href="#"
            id="hr_donate_close"
            class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
          ></a>
          <p style="margin: 10px">
            We don't collect personal data and don't inandate users with ads.
            But we somehow need to run our servers. If you like what we do and
            the service we provide, please consider helping with any amount.
          </p>
          <div>
            <form
              action="https://www.paypal.com/donate"
              method="post"
              target="_top"
            >
              <input type="hidden" name="business" value="ZX5Y74ZARSC72" />
              <input type="hidden" name="no_recurring" value="0" />
              <input
                type="hidden"
                name="item_name"
                value="No personal data collected; No ads. But we need to run our servers. If you like what we do, please help with any amount."
              />
              <input type="hidden" name="currency_code" value="GBP" />
              <input
                type="image"
                src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif"
                border="0"
                name="submit"
                title="PayPal - The safer, easier way to pay online!"
                alt="Donate with PayPal button"
              />
              <img
                alt=""
                border="0"
                src="https://www.paypal.com/en_GB/i/scr/pixel.gif"
                width="1"
                height="1"
              />
            </form>
          </div>
        </div>

        <div id="hr_members" style="padding: 0" class="hr-modal-content unsel">
          <a
            href="#"
            class="ui-btn ui-btn-icon-left ui-icon-member hr-popup-trigger"
            data-hr-help="members"
            style="margin: 0; background: transparent"
            >Group Members</a
          >
          <a
            href="#"
            id="hr_members_close"
            class="ui-btn-right ui-icon-delete ui-btn-icon-notext"
          ></a>
          <div id="members" class="hr-popup">
            Groups help bring people together by topics. Only members can see
            Group posts. Group membership is by invite from other members only.
            Others cannot find or view Group posts. All invited members can post
            to a Group.
          </div>
          <fieldset class="ui-grid-a">
            <div class="ui-block-a" style="width: 10%">
              <span id="hr_fav_favicon" class="ui-btn hr_channel_ch"></span>
            </div>
            <div class="ui-block-b" style="width: 90%">
              <span
                id="hr_fav_name"
                class="ui-btn hr_channel_ch"
                style="font-weight: bold"
                >Group name</span
              >
            </div>
          </fieldset>
          <a
            href="#"
            id="hr_fav_members_total"
            style="margin: 0"
            class="
              hr-invite
              ui-btn ui-btn-icon-left ui-icon-share
              hr-channel-details
            "
            >Invite new members</a
          >
          <input
            type="search"
            id="members_filter"
            class="hr-popup-trigger"
            data-hr-help="memberfilter"
            data-wrapper-class="controlgroup-textinput ui-btn"
            placeholder="filter members"
          />
          <div id="memberfilter" class="hr-popup">
            Filter existing members displayed
          </div>
          <ul
            id="hr_members_list"
            data-role="listview"
            style="margin: 0"
            data-filter="true"
            data-input="#members_filter"
          ></ul>
        </div>

        <div id="hr_member_details_default_port" style="display: none">
          <div
            id="hr_member_details"
            class="ui-mini"
            style="display: none; padding-left: 5px"
          >
            <!--<a href="#" id="hr_member_message" class="ui-btn ui-btn-noicon-left hr-member-status">messages <span>(0)</span></a>-->
            <a
              href="#"
              id="hr_member_reinvite"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >resend invite</a
            >
            <a
              href="#"
              id="hr_member_ban"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >ban</a
            >
            <a
              href="#"
              id="hr_member_unban"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >unban</a
            >
            <a
              href="#"
              id="hr_member_unban_reinvite"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >unban & resend invite</a
            >
            <a
              href="#"
              id="hr_member_remove"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >remove</a
            >
            <a
              href="#"
              id="hr_member_restore"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >restore</a
            >
            <a
              href="#"
              id="hr_member_restore_reinvite"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >restore & resend invite</a
            >
            <a
              href="#"
              id="hr_member_idenitfy"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >ask to identify</a
            >
            <a
              href="#"
              id="hr_member_related"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >members</a
            >
            <a
              href="#"
              id="hr_member_joined"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >joined on <span>pending</span></a
            >
            <a
              href="#"
              id="hr_member_left"
              class="ui-btn ui-btn-noicon-left hr-member-status"
              >left on <span></span
            ></a>
          </div>
        </div>
      </div>

      <input type="text" id="hr_copy_buffer" style="display: none" />

      <div id="channel_form" class="default-null">
        <fieldset class="ui-grid-b">
          <div class="ui-block-a" style="width: 10%">
            <a
              href="#"
              id="remove_channel_filter"
              class="ui-btn ui-btn-icon-notext ui-icon-channel-filter"
              style="display: none; background-color: transparent"
            ></a>
          </div>
          <div class="ui-block-b" style="width: 80%">
            <a
              href="#"
              id="channel_form_header_text"
              class="ui-btn ui-btn-noicon hr-popup-trigger"
              data-hr-help="channels"
              style="margin: 0; background-color: white; color: grey"
              >Groups</a
            >
          </div>
          <div class="ui-block-c" style="width: 10%">
            <span class="hr-help"><i class="fa fa-question-circle"></i></span>
          </div>
        </fieldset>
        <!-- 20220713 UNCOMMENT TO RESTORE CHANNEL TYPES <div id="channels" class="hr-popup">Channels help you build and maintain followers in one place. Your audiences from many platforms can now find your content in one place. Channels organise all your posts by topics. Thus, over time, your channel may become your personal brand. You can also invite followers with links to your channel and then see numbers of followers and leavers, and reactions to your posts</div> 20220713 UNCOMMENT TO RESTORE CHANNEL TYPES -->
        <div id="channels" class="hr-popup">
          Groups help bring people together by topics. Only members can see
          Group posts. Group membership is by invite from other members only.
          Others cannot find or view Group posts. All invited members can post
          to a Group.
        </div>
        <div id="channel_form_view">
          <!-- 20220713 UNCOMMENT TO RESTORE CHANNEL TYPES <input type='search' id="channel_form_search" class="hr-popup-trigger" data-hr-help="channelsearch" data-wrapper-class="controlgroup-textinput ui-btn" placeholder="find or create channel">
			<div id="channelsearch" class="hr-popup">Filter channels displayed (both, your own and followed), search other public channels you might want to follow, or find a channel name not yet taken, so you can use it for your new channel</div> 20220713 UNCOMMENT TO RESTORE CHANNEL TYPES -->
          <input
            type="search"
            id="channel_form_search"
            class="hr-popup-trigger"
            data-hr-help="channelsearch"
            data-wrapper-class="controlgroup-textinput ui-btn"
            placeholder="filter or create group"
          />
          <div id="channelsearch" class="hr-popup">
            Filter groups displayed (both, you created and joined), or type a
            name of a new group you want to create
          </div>
          <a
            id="channel_form_create"
            href="#"
            class="ui-btn ui-corner-none hr-going-active"
            style="display: none; margin: 0; color: grey"
            >find or create group</a
          >
          <div id="channel_form_lists">
            <div
              id="hr_channels_follow"
              style="
                display: none;
                font-weight: bold;
                margin: 10px;
                color: grey;
              "
              class="default-null"
            >
              channels you can follow
            </div>
            <ul
              id="channel_form_search_list"
              data-role="listview"
              style="box-shadow: none; margin: 0 !important"
              data-inset="true"
              class="default-null"
            ></ul>
            <div
              id="hr_channels"
              style="margin: 0 0 0 10px"
              data-role="collapsible-set"
              data-filter="true"
              data-input="#channel_form_search"
            >
              <!--<div id="hr_channels_own_label" style="display:none;font-weight:bold;margin:10px;border-top:thin solid #80808052;padding-top:8px;color:grey">Groups I own</div>
					<div id="hr_channels_own" style="margin: 0 10px 10px 10px" data-role="collapsible-set" data-filter="true" data-input="#channel_form_search"></div>
					<div id="hr_channels_other_label" style="display:none;font-weight:bold;margin:10px;border-top:thin solid #80808052;padding-top:8px;color:grey">Joined groups</div>
					<div id="hr_channels_other" style="margin: 0 10px 10px 10px" data-role="collapsible-set" data-filter="true" data-input="#channel_form_search"></div>-->
            </div>
          </div>
        </div>
        <!--<a href="#" id="homred_choose_channel" style="display:none" class="hr-going-active ui-btn ui-btn-noicon">First, choose or create channel to post to</a>-->
      </div>
    </div>
  </div>
</template>



<style>
.leaflet-tile-container {
  pointer-events: auto;
}
</style>