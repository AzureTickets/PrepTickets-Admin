// object service & several utilities
azureTicketsApp.factory('objectService', function() {
  return {
    /**
     * @param {array}
     *          arr Array to manipulate
     * @param {array}
     *          els Elements that need to be positioned first
     * @param {string}
     *          prop Optional property to lookup when elements are objects.
     * @returns {array}
     */
    prioritizeSort : function(arr, els, prop) {
      var cc = [];
      var ret = arr.filter(function(_c) {
        if (els.indexOf((angular.isDefined(prop) ? _c[prop] : _c)) !== -1) {
          cc.push(_c);
          return false;
        }
        return true;
      });

      return cc.concat(ret);
    },
    /**
     * Iterates over array of objects and returns the element whose property
     * prop is equal to val.
     * 
     * @param arr
     *          {array}
     * @param prop
     *          {string}
     * @param val
     *          {mixed}
     * @returns {object}
     */
    grep : function(arr, prop, val) {
      var ret = null;

      if (angular.isArray(arr)) {
        angular.forEach(arr, function(v, k) {
          if (angular.isDefined(v[prop])) {
            if (angular.equals(v[prop], val)) {
              ret = angular.copy(v);
            }
          }
        });
      }

      return ret;
    },
    /**
     * Iterates over array of objects and returns the number of elements whose
     * property prop is equal to val.
     * 
     * @param arr
     *          {array}
     * @param prop
     *          {string}
     * @param val
     *          {mixed}
     * @returns {object}
     */
    count : function(arr, prop, val) {
      var ret = 0;

      if (angular.isArray(arr)) {
        angular.forEach(arr, function(v, k) {
          if (angular.isDefined(v[prop])) {
            if (angular.equals(v[prop], val)) {
              ret++;
            }
          }
        });
      }

      return ret;
    },
    /**
     * Iterates over array of objects and returns the index of the element whose
     * property prop is equal to val.
     * 
     * @param arr
     *          {array}
     * @param prop
     *          {string}
     * @param val
     *          {mixed}
     * @returns {object}
     */
    getIndex : function(arr, prop, val) {
      var ret = -1;

      if (angular.isArray(arr)) {
        angular.forEach(arr, function(v, k) {
          if (angular.isDefined(v[prop])) {
            if (angular.equals(v[prop], val)) {
              ret = k;
            }
          }
        });
      }

      return ret;
    },
    /**
     * Iterates over array of objects and removes the element whose property
     * prop is equal to val.
     * 
     * @param arr
     *          {array}
     * @param prop
     *          {string}
     * @param val
     *          {mixed}
     * @returns {object}
     */
    remove : function(arr, prop, val) {
      if (angular.isArray(arr)) {
        angular.forEach(arr, function(v, k) {
          if (angular.isDefined(v[prop])) {
            if (angular.equals(v[prop], val)) {
              Array.prototype.splice.call(arr, k, 1)
            }
          }
        });
      }
    },
    /**
     * Prepares and formats a model based object to be used by select2
     * 
     * @param type
     *          {string}
     * @return {object}
     */
    formatSelect2 : function(model) {
      return {
        id : (!model.id ? model.Key : model.id),
        text : (!model.text ? model.Name : model.text)
      }
    },
    /**
     * Converts back from select2 object to model based object
     * 
     * @param o
     *          {object}
     * @param type
     *          {string} Force Type of model
     * @return {object}
     */
    undoFormatSelect2 : function(o, type) {
      return {
        Key : o.id,
        Name : o.text,
        Type : type
      }
    }
  }
});