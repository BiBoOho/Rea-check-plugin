jQuery.noConflict();

(function($, Swal10, PLUGIN_ID) {
  'use strict';

  // Color picker dialog function
  const defaultColorPickerConfig = {
    opacity: false,
    doRender: false,
    buildCallback: function($elm) {
      $elm.addClass('kintone-ui');

      const colorInstance = this.color;
      const colorPicker = this;

      $elm.prepend('<div class="cp-panel">' +
                '<div><label>R</label> <input type="number" max="255" min="0" class="cp-r" /></div>' +
                '<div><label>G</label> <input type="number" max="255" min="0" class="cp-g" /></div>' +
                '<div><label>B</label> <input type="number" max="255" min="0" class="cp-b" /></div>' +
                '<hr>' +
                '<div><label>H</label> <input type="number" max="360" min="0" class="cp-h" /></div>' +
                '<div><label>S</label> <input type="number" max="100" min="0" class="cp-s" /></div>' +
                '<div><label>V</label> <input type="number" max="100" min="0" class="cp-v" /></div>' +
            '</div>').on('change', 'input', function(e) {
        const value = this.value,
          className = this.className,
          type = className.split('-')[1],
          color = {};

        color[type] = value;
        colorInstance.setColor(type === 'HEX' ? value : color,
          type === 'HEX' ? 'HEX' : /(?:r|g|b)/.test(type) ? 'rgb' : 'hsv');
        colorPicker.render();
      });

      const buttons = $elm.append('<div class="cp-disp">' +
                '<button type="button" id="cp-submit">OK</button>' +
                '<button type="button" id="cp-cancel">Cancel</button>' +
            '</div>');

      buttons.on('click', '#cp-submit', (e) => {
        const colorCode = '#' + colorPicker.color.colors.HEX;

        $elm.css('border-bottom-color', colorCode);
        $elm.attr('value', colorCode);

        const $el = colorPicker.$trigger.parent('div').find('input[type="text"]');
        $el.val(colorCode);
        $el.css('color', colorCode);

        colorPicker.$trigger.css('border-bottom-color', colorCode);
        colorPicker.toggle(false);
      });

      buttons.on('click', '#cp-cancel', (e) => {
        colorPicker.toggle(false);
      });
    },
    renderCallback: function($elm, toggled) {
      const colors = this.color.colors.RND;
      const colorCode = '#' + this.color.colors.HEX;

      const modes = {
        r: colors.rgb.r,
        g: colors.rgb.g,
        b: colors.rgb.b,
        h: colors.hsv.h,
        s: colors.hsv.s,
        v: colors.hsv.v,
        HEX: colorCode
      };

      $('input', '.cp-panel').each(function() {
        this.value = modes[this.className.substr(3)];
      });

      this.$trigger = $elm;
    },
    positionCallback: function($elm) {
      this.color.setColor($elm.attr('value'));
    }
  };

  // Set variable for display item
  const popUpContent = [
    {
      text: 'Date and time',  // Text to show on table header
      classCB: 'datetimeCB',  // Use to check set checkbox in display item
      name: 'datetime',       // Use to set name of div that make table
      code: 'DATE_TIME'       // Use to check value from config display item
    }, 
    {
      text: 'Username',       // Text to show on table header
      classCB: 'usernameCB',  // Use to check set checkbox in display item
      name: 'username',       // Use to set name of div that make table
      code: 'USER_SELECT'     // Use to check value from config display item
    },
    {
      text: 'Revision',       // Text to show on table header
      classCB: 'revisionCB',  // Use to check set checkbox in display item
      name: 'revision',       // Use to set name of div that make table
      code: 'REVISION'        // Use to check value from config display item
    }
  ];

  // Color picker input text
  const colorPickerUnreadFontEl = $('#font-color-picker-unread');
  const colorPickerUnreadBgEl = $('#bg-color-picker-unread');
  const colorPickerReadFontEl = $('#font-color-picker-read');
  const colorPickerReadBgEl = $('#bg-color-picker-read');

  const createApi = $('.apiToken #create_api');
  const confirmButton = $('.save');
  const cancelButton = $('.cancel');
  const db_id = $('#db_id');
  const db_api_token = $('#api_token');
  const space_display = $('#indication_list');
  const readed_qty = $('.Qtynumber');
  const reset_value = $('.recordUpdateCB');
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const dateTime = $('.datetimeCB');
  const userName = $('.usernameCB');
  const revision = $('.revisionCB');
  const divEL = $('#dropAndDrag1');

  let display_items = [];

  // HTML tag to append drag and drop box to show list of display item
  const setHTMLPopupList = (id, text, name) => {
    return `<div class='drop' id='${id}' name='${name}' draggable='true' style='display:flex'>
              <i class='gg-menu'></i>
              <h6>${text}</h6>
            </div>`
  }

  if (config) {
    db_id.val(config.db_id);
    db_api_token.val(config.db_api_token);
    space_display.val()
  }

  // Set header and blank space to dropdown
  const setIndicationList = async () => {
    try {
      let $option = $('<option>');
      $option.attr('value', 'header');
      $option.text('header');
      space_display.append($option);
      const param = {'app': kintone.app.getId()};
      const field = await kintone.api('/k/v1/preview/app/form/layout', 'GET', param);
      field.layout.forEach((item) => {
        item.fields.forEach((item2) => {
          if(item2.type === 'SPACER'){
            let $opt = $('<option>');
            $opt.attr('value', item2.elementId);
            $opt.text(item2.elementId);
            space_display.append($opt);
          }
        });
      })
      showConfig();
      return;
    } catch (error) {
      return Swal10.fire('Error', error.message || error, 'error');
    }
  }

  // Set config value to html component when config setting is load
  const showConfig = async () => {
    if(!config) return;
    db_id.val(config.db_id || '');
    db_api_token.val(config.db_api_token || '');
    space_display.val(config.space_display || '');
    readed_qty.val(config.readed_qty || 'Read: {%Num%}');
    // Loop display item from config to set checkbox and append drag and drop component that order from display item array
    display_items = config.display_items ? JSON.parse(config.display_items) : [];
    display_items.forEach((item) => {
      let elementDetail = popUpContent.filter(popupItem => popupItem.code === item.code)[0];
      $(`.${elementDetail.classCB}`).prop('checked', true);
      divEL.append(setHTMLPopupList(elementDetail.code, elementDetail.text, elementDetail.name));
    });
    // Set reset update check box
    let resetCheck = config.reset_value || 'no'; 
    let resetFlag = resetCheck === 'yes' ? true : false;
    reset_value.prop('checked', resetFlag);
    // Get color from config if no color set default color 
    let unreadColor = config.unread ? {
      text: JSON.parse(config.unread).text,
      bg: JSON.parse(config.unread).bg
    } : {
      text: '#000000',
      bg: '#'
    };
    let readColor = config.readed ? {
      text: JSON.parse(config.readed).text,
      bg: JSON.parse(config.readed).bg
    } : {
      text: '#000000',
      bg: '#'
    };
    colorPickerUnreadFontEl.val(unreadColor.text);
    colorPickerUnreadBgEl.val(unreadColor.bg);
    colorPickerReadFontEl.val(readColor.text);
    colorPickerReadBgEl.val(readColor.bg);
    colorPickerUnreadFontEl.css('color', unreadColor.text);
    colorPickerUnreadBgEl.css('color', unreadColor.bg);
    colorPickerReadFontEl.css('color', readColor.text);
    colorPickerReadBgEl.css('color', readColor.bg);
  }

  // Create config to save in plugin config setting
  const setConfig = async () => {
    if(!db_id.val()) throw new Error('Please input db app id');
    if(!readed_qty.val()) throw new Error('Please input read already statement text');
    if(isNaN(parseInt(db_id.val()))) throw new Error('App id shoud be in number');
    let body = {
      'app': db_id.val()
    };
    try {
      // Using api to check if app id and api token that defined is for ReadDB app
      let checkReadDB = await window.RsComAPI.kintoneApi(kintone.api.url('/k/v1/app/form/fields', true), 'GET', body, db_api_token.val());
      let fieldCodes = popUpContent.map(item => item.code); 
      let fieldExist = fieldCodes.every(value => Object.prototype.hasOwnProperty.call(checkReadDB.properties, value));
      if(!fieldExist) throw new Error('App ID and Api Token that defined is not for ReadDB app');
      display_items = [];
      $('.drop').each(function() {
        display_items.push({
          label: $(this).attr('name'),
          code: $(this).attr('id')
        });
      });
      let isResetChecked = reset_value.prop('checked');
      let unread = {
        text: colorPickerUnreadFontEl.val(),
        bg: colorPickerUnreadBgEl.val(),
      };
      let readed = {
        text: colorPickerReadFontEl.val(),
        bg: colorPickerReadBgEl.val(),
      };
      let configuration = {
        db_id: db_id.val(),
        db_api_token: db_api_token.val(),
        space_display: space_display.val(),
        readed_qty: readed_qty.val() ,
        display_items: JSON.stringify(display_items),
        reset_value: isResetChecked ? 'yes' : 'no',
        unread: JSON.stringify(unread),
        readed: JSON.stringify(readed)
      };
      return configuration;
    } catch (error) {
      throw new Error(error.message || error);
    }
  }

  $(document).ready(function() {
    setIndicationList();
    // Create API token function
    createApi.on('click', function () {
      if(!db_id.val()) return Swal10.fire('No DB App ID', 'Please enter DB app ID!', 'error');
      let protocol = window.location.protocol;
      let hostname = window.location.hostname;
      let path = '/k/admin/app/apitoken';
      let queryString = '?app=' + encodeURIComponent(db_id.val());
      let url = protocol + '//' + hostname + path + queryString;
      window.open(url, '_BLANK');
    });

    // Make input db id only number
    $('#db_id').on('input', function() {
      $(this).val($(this).val().replace(/[^0-9]/g, ''));
    });

    // Function provided as the event handler is executed
    $(document).on('dragstart', '#dropAndDrag1 > div', function (event) {    // comment each drag function
      $(this).addClass('dragging');
      event.originalEvent.dataTransfer.setData('text/plain', '');
    });

    // Element is being dragged over a valid drop target
    $(document).on('dragover', '#dropAndDrag1 > div', function (event) {
      event.preventDefault();
      $(this).addClass('dragover');
    });

    // Remove class dragover
    $(document).on('dragleave', '#dropAndDrag1 > div', function () {
      $(this).removeClass('dragover');
    });

    // Check position 
    $(document).on('drop', '#dropAndDrag1 > div', function (event) {
      event.preventDefault();
      $(this).removeClass('dragover');
      const draggedRow = $('.dragging');
      const targetRow = $(this);

      if (draggedRow.index() < targetRow.index()) {
        draggedRow.insertAfter(targetRow);
      } else {
        draggedRow.insertBefore(targetRow);
      }
    });

    // Remove class dragging
    $(document).on('dragend', '#dropAndDrag1 > div', function () {
      $(this).removeClass('dragging');
    });
    //todo Drag and Drop
    
    // todo check value checkbox
    $(document).on('click', '.datetimeCB', function() {
      if(dateTime.prop('checked')) {
        divEL.append(setHTMLPopupList('DATE_TIME', 'Date and time', 'datetime'));
      }else{
        $('#DATE_TIME').remove();
      }
    });

    $(document).on('click', '.usernameCB', function() {
      if(userName.prop('checked')){
        divEL.append(setHTMLPopupList('USER_SELECT', 'Username', 'username'));
      }else{
        $('#USER_SELECT').remove();
      }
    });

    $(document).on('click', '.revisionCB', function() {
      if(revision.prop('checked')){
        divEL.append(setHTMLPopupList('REVISION', 'Revision', 'revision'));
      }else{
        $('#REVISION').remove();
      }
    });
    // todo check value

    // Color Picker
    const $colorPickerUnreadFont = $('#font-color-picker-unread-icon').colorPicker(defaultColorPickerConfig);
    const $colorPickerUnreadBg = $('#bg-color-picker-unread-icon').colorPicker(defaultColorPickerConfig);
    const $colorPickerReadFont = $('#font-color-picker-read-icon').colorPicker(defaultColorPickerConfig);
    const $colorPickerReadBg = $('#bg-color-picker-read-icon').colorPicker(defaultColorPickerConfig);

    $(document).keyup((event) => {
      const TAB_KEY_CODE = 9;
      const ENTER_KEY_CODE = 13;
      const ESC_KEY_CODE = 27;
      if (event.keyCode === TAB_KEY_CODE || event.keyCode === ENTER_KEY_CODE || event.keyCode === ESC_KEY_CODE) {
        $colorPickerUnreadFont.colorPicker.toggle(false);
        $colorPickerUnreadBg.colorPicker.toggle(false);
        $colorPickerReadFont.colorPicker.toggle(false);
        $colorPickerReadBg.colorPicker.toggle(false);
      }
    });

    // Set color when input text change
    colorPickerUnreadFontEl.change(function(){
      $(this).css('color', $(this).val());
    });
    colorPickerUnreadBgEl.change(function(){
      $(this).css('color', $(this).val());
    });
    colorPickerReadFontEl.change(function(){
      $(this).css('color', $(this).val());
    });
    colorPickerReadBgEl.change(function(){
      $(this).css('color', $(this).val());
    });

    // Save button
    confirmButton.on('click', async function () {
      await setConfig().then((config) => {
        kintone.plugin.app.setConfig(config, function () {
          Swal10.fire(
            'Complete',          
            'プラグインの設定が完了しました、アプリを更新してください！',
            'success'
          ).then(function () {
            window.location.href = '../../flow?app=' + kintone.app.getId() + '#section=settings';
          });
        });
      }).catch((error) => {
        Swal10.fire('Error', error.message || error, 'error');
      });
    })
  
    // Cancel button
    cancelButton.on('click', function() {
      window.location.href = '../../' + kintone.app.getId() + '/plugin/';
    });
  })
})(jQuery, Sweetalert2_10.noConflict(true), kintone.$PLUGIN_ID);
