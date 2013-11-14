// Extentions
String.prototype.format = function() {
  var formatted = this;
  for ( var i = 0; i < arguments.length; i++) {
    var regexp = new RegExp('\\{' + i + '\\}', 'gi');
    formatted = formatted.replace(regexp, arguments[i]);
  }
  return formatted;
};

Date.prototype.getGMTOffset = function() {
  return (this.getTimezoneOffset() > 0 ? "-" : "+")
      + BWL
          .leftPad(Math.abs(Math.floor(this.getTimezoneOffset() / 60)), 2, '0')
      + BWL.leftPad(this.getTimezoneOffset() % 60, 2, '0');
};

// Main BWL Namespace
var BWL = {
  // Global variables
  Server : '<%= at.urlApi %>',
  Store : null,
  StoreKey : null,
  Profile : null,
  ElementMap : new Array(),

  // Global Constants
  URIDELIMITER : "#!/",
  LOADINGTEXT : "&nbsp;loading&nbsp;",
  RETRYDELAY : 500,

  xhdList : new Array(),

  InvokeService : function(method, url, data, successCallback, errorCallback) {
    method = method.toUpperCase();

    if (errorCallback == undefined){errorCallback = BWL.ServiceFailedCallback;}

    // the default config is a simple request
    var requestConfig = {
      url : url,
      method : method
    };

    if (method == "POST" || method == "PUT") {
      var contentType = "";

      // if this is a JS object, convert to JSON, else just pass the data as
      // form data
      if (typeof data == 'object') {
        contentType = "application/json";
        data = BWL.Plugins.json2.stringify(data);
      } else {
        contentType = "application/x-www-form-urlencoded";
      }

      // setup for posting data
      requestConfig.headers = {
        "Content-Type" : contentType,
        "Content-Length" : data.length
      };
      requestConfig.data = data;
    }

    var host = BWL.getHost(url);
    var xhd = this.xhdList[host];

    if (xhd == null) {
      xhd = new BWL.Plugins.easyXDM.Rpc({
        remote : host + "/embed/Plugins/easyXDM/cors.html",
      }, {
        remote : {
          request : {}
        }
      });
      this.xhdList[host] = xhd;
    }

    // send the request
    xhd.request(requestConfig,
    // success
    function(rpcdata) {
      var modelObj = BWL.Plugins.json2.parse(rpcdata.data);

      if (modelObj.Message == 'OK') {
        // the request worked, return the object
        successCallback(BWL.Plugins.json2.parse(modelObj.Object), modelObj);
      } else {
        // there was a server error, alert the message
        errorCallback('Server Error:\n\n' + modelObj.Message, modelObj);
      }
    },
    // error
    function(error) {
      errorCallback('Service Error:\n\n' + error.message);
    });
  },

  ServiceFailedCallback : function(errorMessage) {
    alert(errorMessage);
  },

  JSON2Obj : function(JSON) {
    return BWL.Plugins.json2.parse(JSON);
  },

  Obj2JSON : function(JSON) {
    return BWL.Plugins.json2.stringify(JSON);
  },

  // base helpers
  dump : function(arr, eolchar, level, levelId) {
    var dumped_text = "";
    var paddding = "    ";
    if (!level){level = 0;}
    if (!eolchar){eolchar = "\n";}
    if (!levelId){levelId = Date.now() + ".";}

    if (eolchar != "\n"){paddding = "&nbsp;&nbsp;&nbsp;&nbsp;";}

    // The padding given at the beginning of the line.
    var level_padding = "";
    for ( var j = 0; j < level + 1; j++) {level_padding += paddding;}

    if (typeof arr == 'object') { // Array/Hashes/Objects
      for ( var item in arr) {
        var value = arr[item];

        if (typeof value == 'object') { // If it is an array,
          levelId += item;
          dumped_text += level_padding + item;
          if (value != null && value != undefined) {
            if (eolchar == "\n") {
              dumped_text += BWL.dump(value, eolchar, level + 1, levelId + ".");
            } else {
              var label = "";

              // add the type, key or both to the label if available
              if (value.Key != undefined){label += value.Key;}
              if (label.length == 0){label += "=>";}

              dumped_text += " <a href=\"javascript:BWL.toggle('" + levelId
                  + "');\">" + label + "</a>";
              dumped_text += eolchar;
              dumped_text += "<div id='" + levelId + "' style='display: none'>";
              dumped_text += BWL.dump(value, eolchar, level + 1, levelId + ".");
              dumped_text += "</div>";
            }
          } else {
            dumped_text += " => null" + eolchar;
          }
        } else if (typeof value == 'function') {
          dumped_text += level_padding + item + " => \"" + eval(value) + "\""
              + eolchar;
        } else if (typeof value == 'string') {
          dumped_text += level_padding + item + " => \"" + value + "\""
              + eolchar;
        } else {
          dumped_text += level_padding + item + " => " + value + eolchar;
        }
      }
    } else { // Stings/Chars/Numbers etc.
      dumped_text = "(" + typeof arr + ")=>" + arr;
    }
    return dumped_text;
  },

  toggle : function(target) {
    var obj = document.getElementById(target);
    obj.style.display = obj.style.display == "block" ? "none" : "block";
  },

  leftPad : function(val, size, ch) {
    var result = new String(val);
    if (ch === null || ch === undefined || ch === '') {
      ch = " ";
    }
    while (result.length < size) {
      result = ch + result;
    }
    return result;
  },

  isArray : function(obj) {
    // returns true is it is an array
    if (obj == undefined || obj == null
        || obj.constructor.toString().indexOf('Array') == -1) {
      return false;
    } else {
      return true;
    }
  },

  getHost : function(url) {
    var a = document.createElement("a");
    a.href = url;

    if (a.port != "0" && a.port != "80" && a.port != "443") {
      return a.protocol + "//" + a.hostname + ":" + a.port;
    } else {
      return a.protocol + "//" + a.hostname;
    }
  }
};

BWL.Plugins = {};
BWL.Plugins.easyXDM = typeof easyXDM !== 'undefined' ? easyXDM : {};
BWL.Services = {};
BWL.ServicesMeta = {};
BWL.Model = {};
BWL.ModelEnum = {};
BWL.ModelMeta = {};
BWL.Helpers = {};

// Auth functions
BWL.Auth = {
  ClientKey : null,
  PopupWidth : 0,
  PopupHeight : 0,
  PopupWindow : null,
  BeginLogonAsyncCallback : null,
  BeginLogoffAsyncCallback : null,
  LoadProfileAsyncCallback : null,

  Init : function(clientKey, popupWidth, popupHeight) {
    if (popupWidth == undefined){popupWidth = 500;}
    if (popupHeight == undefined){popupHeight = 500;}

    this.ClientKey = clientKey;
    this.PopupHeight = popupHeight;
    this.PopupWidth = popupWidth;

    // see if the user is already logged in
    this.LoadProfileAsync(null);
  },

  LoadProfileAsync : function(successCallback, errorCallback) {
    if (errorCallback == undefined){errorCallback = BWL.ServiceFailedCallback;}
    BWL.Auth.LoadProfileAsyncCallback = successCallback;

    BWL.Services.AccountService.GetProfileAsync(BWL.Auth.GetProfileCallback);
  },

  GetProfileCallback : function(profile) {
    BWL.Profile = null;
    if (profile != undefined && profile != null && profile.AccessToken != null) {
      BWL.Profile = profile;
    }
    if (BWL.Auth.LoadProfileAsyncCallback != null) {
      // return to the callback
      BWL.Auth.LoadProfileAsyncCallback();
      // now remove the callback
      BWL.Auth.LoadProfileAsyncCallback = null;
    }
  },

  GetAuthLogonURL : function(providerName, redirectURL) {
    return BWL.Server
        + '/auth/logon?providerName={0}&clientKey={1}&display=HTML&redirectURL={2}'
            .format(providerName, BWL.Auth.ClientKey, redirectURL);
  },

  GetAuthAddLogonURL : function(providerName, redirectURL) {
    return BWL.Server
        + '/auth/addLogon?providerName={0}&clientKey={1}&display=HTML&redirectURL={2}'
            .format(providerName, BWL.Auth.ClientKey, redirectURL);
  },

  LogonAsync : function(provider, successCallback, errorCallback) {
    if (errorCallback == undefined){errorCallback = BWL.ServiceFailedCallback;}
    BWL.Auth.BeginLogonAsyncCallback = successCallback;

    var authURL = this.GetAuthLogonURL(provider, '');

    BWL.Auth.PopupWindow = BWL.Helpers.UI.PopupCenter(authURL, 'AuthWindow',
        BWL.Auth.PopupWidth, BWL.Auth.PopupHeight);

    if (BWL.Helpers.UI.IsPopupClosed(BWL.Auth.PopupWindow)) {
      // no popups allowed, use inline
      window.location = this.GetAuthLogonURL(provider, window.location);
    } else {
      // now start watching the login window
      setTimeout(BWL.Auth.CheckLoginWindow, BWL.RETRYDELAY);
    }
  },

  CheckLoginWindow : function() {
    // see if the window is still open
    if (BWL.Helpers.UI.IsPopupClosed(BWL.Auth.PopupWindow)) {
      // it is not open, try and get the profile
      BWL.Auth.PopupWindow = null;

      BWL.Auth.LoadProfileAsync(BWL.Auth.BeginLogonAsyncCallback);
    } else {
      setTimeout(BWL.Auth.CheckLoginWindow, BWL.RETRYDELAY);
    }
  },

  BeginLogoffAsync : function(successCallback, errorCallback) {
    if (errorCallback == undefined){errorCallback = BWL.ServiceFailedCallback;}
    BWL.Auth.BeginLogoffAsyncCallback = successCallback;

    BWL.Services.AuthService.LogoffAsync(BWL.Auth.LogoffCallback);
  },

  LogoffCallback : function(result) {
    BWL.Profile = null;

    if (BWL.Auth.BeginLogoffAsyncCallback != null) {
      // return to the callback
      BWL.Auth.BeginLogoffAsyncCallback();
      // now remove the callback
      BWL.Auth.BeginLogoffAsyncCallback = null;
    }
  },

  AddLogonAsync : function(provider, successCallback, errorCallback) {
    if (errorCallback == undefined){errorCallback = BWL.ServiceFailedCallback;}
    BWL.Auth.BeginLogonAsyncCallback = successCallback;

    var authURL = this.GetAuthAddLogonURL(provider, '');

    BWL.Auth.PopupWindow = BWL.Helpers.UI.PopupCenter(authURL, 'AuthWindow',
        BWL.Auth.PopupWidth, BWL.Auth.PopupHeight);

    if (BWL.Helpers.UI.IsPopupClosed(BWL.Auth.PopupWindow)) {
      // no popups allowed, use inline
      window.location = this.GetAuthAddLogonURL(provider, window.location);
    } else {
      // now start watching the login window
      setTimeout(BWL.Auth.CheckLoginWindow, BWL.RETRYDELAY);
    }
  },

  HashPassword : function(password) {
    return BWL.Plugins.MD5(password);
  }
};

// Membership functions
BWL.Membership = {
  RegisterAsync : function(fullName, email, password, successCallback,
      errorCallback) {
    if (successCallback == undefined){successCallback = this.RegisterCallback;}
    if (errorCallback == undefined){errorCallback = BWL.ServiceFailedCallback;}

    var membership = {};
    membership.FullName = fullName;
    membership.Email = email;
    membership.PasswordHash = BWL.Auth.HashPassword(password);

    BWL.Services.MembershipService.RegisterAsync(BWL.StoreKey, membership,
        successCallback, errorCallback);
  },

  RegisterCallback : function() {
    BWL.Auth.LoadProfileAsync(null);
  },

  LoginAsync : function(email, password, successCallback, errorCallback) {
    if (successCallback == undefined){successCallback = this.LoginCallback;}
    if (errorCallback == undefined){errorCallback = BWL.ServiceFailedCallback;}

    var membership = {};
    membership.Email = email;
    membership.PasswordHash = BWL.Auth.HashPassword(password);

    BWL.Services.MembershipService.LoginAsync(BWL.StoreKey, membership,
        successCallback, errorCallback);
  },

  LoginCallback : function() {
    BWL.Auth.LoadProfileAsync(null);
  },

  ResetPasswordAsync : function(email, successCallback, errorCallback) {
    if (successCallback == undefined){successCallback = this.ResetPasswordCallback;}
    if (errorCallback == undefined){errorCallback = BWL.ServiceFailedCallback;}

    var membership = {};
    membership.Email = email;

    BWL.Services.MembershipService.ResetPasswordAsync(BWL.StoreKey, membership,
        successCallback, errorCallback);
  },

  ResetPasswordCallback : function(result) {
    if (result == true) {
      alert('Password reset request sent to email address.');
    } else {
      alert('Could not send reset password request.');
    }
  },

  ChangePasswordAsync : function(email, currentPassword, newPassword,
      successCallback, errorCallback) {
    if (successCallback == undefined){successCallback = this.ChangePasswordCallback;}
    if (errorCallback == undefined){errorCallback = BWL.ServiceFailedCallback;}

    var membership = {};
    membership.Email = email;
    membership.PasswordHash = BWL.Auth.HashPassword(currentPassword);

    BWL.Services.MembershipService.ChangePasswordAsync(BWL.StoreKey, BWL.Auth
        .HashPassword(newPassword), membership, successCallback, errorCallback);
  },

  ChangePasswordCallback : function(result) {
    if (result == true) {
      alert('Password changed.');
    } else {
      alert('Could not change password.');
    }
  }
};

// UI Helpers
BWL.Helpers.UI = {
  Inject : function(template, item, crawlitem) {
    if (crawlitem == undefined || crawlitem == null){crawlitem = true;}

    // Clean-up the template
    template = unescape(template);
    // Inject the item first
    template = this.InjectItem(template, item, crawlitem);
    // Inject the logic second
    template = this.InjectLogic(template, item);

    return template;
  },

  InjectItem : function(template, item, crawlitem, prefix) {
    if (crawlitem == undefined || crawlitem == null){crawlitem = true;}
    if (prefix == undefined || prefix == null){prefix = "";}

    if (item != undefined && item != null) {
      // inject the item
      for (prop in item) {
        // if this is another object, keep crawling
        if (item[prop] != null && typeof item[prop] == "object") {
          if (crawlitem){template = this.InjectItem(template, item[prop],
              crawlitem, prefix + prop + ".");}
        } else {
          template = template.replace(new RegExp('\\{item.' + prefix + prop
              + '\\}', 'gi'), item[prop]);
        }
      }
    }

    return template;
  },

  InjectLogic : function(template, item) {
    // now do the logic
    var tmpl = template;
    var re = new RegExp('({\=[^}]+})', 'gi');
    while (match = re.exec(template)) {
      var logic = match[0].substr(2, match[0].length - 3);
      logic = logic.replace(new RegExp('&gt;', 'gi'), '>');
      logic = logic.replace(new RegExp('&lt;', 'gi'), '<');
      logic = logic.replace(new RegExp('\n', 'gi'), '');
      var result = null;
      eval("result = " + logic);
      tmpl = tmpl.replace(match[0], result);
    }

    return tmpl;
  },

  CompareDisplayOrder : function(a, b) {
    try {
      if (a.DisplayOrder < b.DisplayOrder) {
        return -1;
      }
      if (a.DisplayOrder > b.DisplayOrder) {
        return 1;
      }
    } catch (e) {
    } // ignore an error
    return 0;
  },

  SortDisplayOrder : function(data) {
    // sort the data on DisplayOrder, if available
    if (data != undefined && data.length > 0
        && data[0].DisplayOrder != undefined) {
      data.sort(this.CompareDisplayOrder);
    }
  },

  BuildListTemplate : function(elementName, data, selected) {
    selected = selected == undefined ? null : selected;

    var html, items = "";

    html = BWL.$(elementName + "_view").html();

    if (data != undefined && data != null) {
      this.SortDisplayOrder(data);

      for (pos in data) {
        items += selected == data[pos].Key ? this.Inject(BWL.$(
            elementName + "_view_selected").html(), data[pos]) : this.Inject(
            BWL.$(elementName + "_view_item").html(), data[pos]);
      }
    }

    // add the footer
    html = html.replace("{items}", items);

    return html;
  },

  BuildGridTemplate : function(elementName, data, gridTitle, itemsperrow) {
    if (itemsperrow == undefined){itemsperrow = 4;}

    var html = "";
    var rows = "";
    var items = "";

    if (data != undefined && data != null) {
      this.SortDisplayOrder(data);

      var rowCount = 0;

      for (pos in data) {
        rowCount++;
        if (rowCount > itemsperrow) {
          // new row
          rowCount = 1;
          // add the row
          rows += BWL.$(elementName + "_view_row").html().replace("{items}",
              items);
          items = "";
        }
        // add the item
        items += this.Inject(BWL.$(elementName + "_view_item").html(),
            data[pos]);
      }

      // add the row
      if (items.length > 0){rows += BWL.$(elementName + "_view_row").html()
          .replace("{items}", items);}
    }

    html = BWL.$(elementName + "_view").html().replace("{rows}", rows);

    // add the title
    html = html.replace("{Grid.Title}", gridTitle);

    return html;
  },

  DisplayLoading : function(elementName) {
    elementName = elementName == undefined ? null : elementName;

    if (elementName != null) {
      var element = BWL.$(elementName);

      if (element != undefined && element != null) {
        var char = element.html().replace(BWL.LOADINGTEXT, "");

        switch (char) {
          case "":
            char = "/";
            break;
          case "|":
            char = "/";
            break;
          case "/":
            char = "-";
            break;
          case "-":
            char = "\\";
            break;
          case "\\":
            char = "|";
            break;
        }

        element.html(BWL.LOADINGTEXT + char);
      }
    }
  },

  IsPopupClosed : function(popup) {
    var windowClosed = false;
    try {
      windowClosed = !popup || popup.closed
          || typeof popup.closed == 'undefined' || typeof popup.document.getElementById == "undefined";
    } catch (error) {
    }
    return windowClosed;
  },

  PopupCenter : function(url, title, width, height) {
    var left = screen.width / 2 - width / 2;
    var top = screen.height / 2 - height / 2;
    var popup = window
        .open(
            url,
            title,
            'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width='
                + width
                + ', height='
                + height
                + ', top='
                + top
                + ', left='
                + left);

    if (!BWL.Helpers.UI.IsPopupClosed(popup)) {
      popup.focus();
    }

    return popup;
  },

  OpenInlineBrowser : function(url, title, width, height) {
    if (!title) {
      var title = "";
    }
    if (!width) {
      var width = 500;
    }
    if (!height) {
      var height = 500;
    }

    var browser = BWL.$(
        '<div><input type="text" style="width:100%;" disabled="disabled" value="'
            + url + '" /><br/><iframe src="' + url
            + '" style="width:100%;height:' + height + 'px;" /></div>').dialog(
        {
          title : title,
          bgiframe : true,
          autoOpen : false,
          width : width,
          modal : true,
          closeOnEscape : false,
          draggable : true,
          resizable : false
        });

    browser.dialog('open');

    return false;
  },

  DialogCache : [],

  OpenDialog : function(html, title, width, height) {
    if (!height){height = 200;}

    // make id by geting the date now as a number
    var id = Date.now();

    if (this.DialogCache[id] == undefined || this.DialogCache[id] == null) {
      // create
      this.DialogCache[id] = BWL.$('<div></div>').html(html).dialog({
        title : title,
        bgiframe : true,
        autoOpen : false,
        minHeight : height,
        width : width,
        modal : true,
        closeOnEscape : false,
        draggable : true,
        resizable : true,
        close : function() {
          BWL.Helpers.UI.CloseDialogCallback(id);
        }
      });
    }

    // open
    this.DialogCache[id].dialog('open');

    return id;
  },

  CloseDialogCallback : function(id) {
    if (this.DialogCache[id] != undefined && this.DialogCache[id] != null) {
      // close
      this.DialogCache[id].html('');
    }
  },

  CloseDialog : function(id) {
    if (this.DialogCache[id] != undefined && this.DialogCache[id] != null) {
      // close
      this.DialogCache[id].dialog('close');
    }
  },

  SetDialogTitle : function(id, title) {
    if (this.DialogCache[id] != undefined && this.DialogCache[id] != null) {
      // set title
      return this.DialogCache[id].dialog('option', 'title', title);
    }
  }
};

// Category helpers
BWL.Helpers.Category = {
  SearchForCategoryItems : function(searchObj, categoryReturn) {
    if (searchObj != undefined && searchObj != null) {
      if (BWL.isArray(searchObj)) {
        for ( var pos in searchObj) {
          // do each item
          this.SearchForCategoryItems(searchObj[pos], categoryReturn);
        }
      } else if (searchObj.Type != undefined) {
        if (searchObj.Type != 'Store' && searchObj.Categories != undefined
            && BWL.isArray(searchObj.Categories)) {
          // this is an item that has searchable Categories
          for ( var categoryPos in searchObj.Categories) {
            var category = searchObj.Categories[categoryPos];

            if (!BWL.isArray(categoryReturn[category.Key])){categoryReturn[category.Key] = new Array();}

            // save the item to the array
            categoryReturn[category.Key].push(searchObj);
          }
        } else {
          // cycle thru the props
          for ( var prop in searchObj) {
            if (searchObj[prop] != undefined && searchObj[prop] != null) {
              if (typeof searchObj[prop] == 'object') {
                this.SearchForCategoryItems(searchObj[prop], categoryReturn);
              }
            }
          }
        }
      }
    }
  },

  GetCategoriesWithItems : function() {
    var categoryReturn = new Array();
    // for caregories, crawl an object looking for Items or Events lists, and
    // then in them, they will have a Categories item, search that
    this.SearchForCategoryItems(BWL.Store, categoryReturn);
    return categoryReturn;
  },

  GetCategoryWithItems : function(categoryKey) {
    if (BWL.Store._categoryCache == undefined) {
      BWL.Store._categoryCache = BWL.Helpers.Category.GetCategoriesWithItems();
    }

    // return only this category
    return BWL.Store._categoryCache[categoryKey] != undefined ? BWL.Store._categoryCache[categoryKey]
        : null;
  },

  CheckCategory : function(category, categoryKey) {
    if (category != null) {
      if (category.Key == categoryKey) {
        return category;
      }
      // now search the category children
      if (category.ChildCategories != null
          && category.ChildCategories != undefined
          && BWL.isArray(category.ChildCategories)) {
        for ( var childPos in category.ChildCategories) {
          return this.CheckCategory(category.ChildCategories[childPos],
              categoryKey);
        }
      }
    }
    return null;
  },

  FindStoreCategory : function(categoryKey) {
    // used to search the store for the category object
    if (BWL.Store != null && BWL.Store.Categories != undefined
        && BWL.Store.Categories != null && BWL.isArray(BWL.Store.Categories)) {
      for ( var catPos in BWL.Store.Categories) {
        var category = BWL.Helpers.Category.CheckCategory(
            BWL.Store.Categories[catPos], categoryKey);
        if (category != null) {
          return category;
        }
      }
    }
    return null;
  }
};
