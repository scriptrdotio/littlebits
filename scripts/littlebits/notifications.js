/** Script ACLs do not delete 
 read=nobody 
write=nobody
execute=authenticated 
  **/ 
 var clientModule = require("./cloudbitsClient");
var config = require("./config");
var mappings = require("./mappings");

/**
 * This class manages subscriptions to events that are generated by littlebits devices
 * @class NotificationManager
 * @constructor NotificationManager
 * @param {Object} params {
 *	{String} token: (optional) a Cloudbits authentication token. If none is provided
 * 	the constructor falls back to the token defined in the config file.
 * }
 */
function NotificationManager(params) {
  
  var token = params && params.token ? params.token : config.token;
  this.client = new clientModule.CloudbitsClient({token:token});
}

/**
 * This method can throw exceptions
 * @method listSubscriptions
 * @param {Object} {
 *	{String} publisherId: return the subscriptions that exist for this publisher device id
 *}
 * @return {Array} list of subsriptions info for the given publisher id: {
 * 	{String} "publisher_id": the device's id
 *  {String} "subscriber_id": the id of the subscribed device or callback url
 *  {Array}	"publisher_events": [ // the events that are monitored
 *	{
 *		{String} "name": the name of the event (littlebit name)
 *		{String} "key: the value that matches the "name" as defined in @see mapping.events 
 *  }
 */
NotificationManager.prototype.listSubscriptions = function(params) {
  
  if (!params || !params.publisherId) {
    
    throw {
      "errorCode": "Invalid_Parameter",
      "errorDetail": "NotificationManager.listSubscriptions : publisherId cannot be null or empty"
    };
  }
  
  var getSubsriptionsParams = {    
    url: config.subscriptionsUrl + "?publisher_id=" +  params.publisherId
  };
  
  var subscriptions = this.client.callApi(getSubsriptionsParams);
  for (var i = 0; i < subscriptions.length; i++) {
    
    var subscription = subscriptions[i];
    if (subscription.publisher_events) {
      
      for (var j = 0; j < subscription.publisher_events.length; j++) {
        subscription.publisher_events[j].key = mappings.events.find([subscription.publisher_events[j].name]);
      }
    }
  }
  
  return subscriptions;
};

/**
 * This method can throw exceptions
 * @method subscribeToNotification
 * @param {Object} params {
 *	{String} publisherId: the identifier of the littlebits device to monitor
 * 	{String} subscriberId: (optional) the id or callbac url to send events to. If not provided, will use
 *	the callback URL defined in the config file.
 *	{Array} events: array of events to subscribe to (@see mapping.events)
 * }
 * @return {Object} subscription object
 */
NotificationManager.prototype.subscribeToNotifications = function(params) {
  
  if (!params || !params.publisherId) {
    
    throw {
      "errorCode": "Invalid_Parameter",
      "errorDetail": "NotificationManager.subscribeToNotifications : publisherId cannot be null or empty"
    };
  }
  
  if (!params.events || params.events.length == 0) {
    
     throw {
      "errorCode": "Invalid_Parameter",
      "errorDetail": "NotificationManager.subscribeToNotification : events cannot be null or empty"
    };
  }
    
  var subscriberId = 
      params.subscriberId ? params.subscriberId : config.notificationConfig.callback + "?auth_token=" + config.notificationConfig.authToken;
  
  var payload = {

    publisher_id: params.publisherId, 
    subscriber_id: subscriberId,
    publisher_events: params.events
  };

  var subscribeParams = {

    url: config.subscriptionsUrl,
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST",
    bodyString: JSON.stringify(payload)
  };

  return this.client.callApi(subscribeParams);
};  	

/**
 * This method can throw exceptions
 * @method deleteSubscription
 * @param {Object} params {
 *	{String} publisherId: the identifier of the littlebits device to monitor
 * 	{String} subscriberId: (optional) the id or callbac url to send events to. If not provided, will use
 *	the callback URL defined in the config file.
 * }
 * @return {Array} array of numeric values
 */
NotificationManager.prototype.deleteSubscription = function(params) {
  
  if (!params || !params.publisherId) {
    
    throw {
      "errorCode": "Invalid_Parameter",
      "errorDetail": "NotificationManager.deleteSubscription : publisherId cannot be null or empty"
    };
  }
  
  var subscriberId = 
      params.subscriberId ? params.subscriberId : config.notificationConfig.callback + "?auth_token=" + config.notificationConfig.authToken;

  var unsubscribePayload = {
    
    "subscriber_id": subscriberId,
    "publisher_id": params.publisherId
  };
  
  var unsubscribeParams = {

    url: config.subscriptionsUrl,
    headers: {
      "Content-Type": "application/json"
    },
    method: "DELETE",
    bodyString: JSON.stringify(unsubscribePayload)
  };
  
  return this.client.callApi(unsubscribeParams);  
};			