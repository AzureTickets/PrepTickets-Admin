BWL.ModelEnum.AccessRequestResponseEnum = {
  Pending : 0,
  Rejected : 1,
  Accepted : 2
};
BWL.ModelEnum.AddressTypeEnum = {
  None : 0,
  Home : 1,
  Work : 2,
  Business : 3,
  BusinessContact : 4
};
BWL.ModelEnum.AuthSessionStateEnum = {
  None : 0,
  New : 1,
  Created : 2,
  ProvidersListed : 3,
  ThirdPartyURLRetrieved : 4,
  ThirdPartyDeclined : 5,
  Complete : 6,
  Ended : 7
};
BWL.ModelEnum.AuthSessionTypeEnum = {
  None : 0,
  Logon : 1,
  AddLogon : 2
};
BWL.ModelEnum.AuthTokenStateEnum = {
  None : 0,
  New : 1,
  LoggedOff : 2,
  LoggedIn : 3,
  Locked : 4
};
BWL.ModelEnum.CartStateEnum = {
  None : 0,
  New : 1,
  Open : 2,
  Pending : 3,
  Error : 4,
  Canceled : 5,
  Paid : 6,
  Processing : 7,
  Done : 10
};
BWL.ModelEnum.ContactRoleEnum = {
  None : 0,
  Self : 1,
  Owner : 2,
  Executive : 3,
  Director : 4,
  Manager : 5,
  Representative : 6,
  Agent : 7,
  Legal : 8,
  PR : 9,
  Label : 10,
  Distributor : 11,
  Media : 12,
  Assistant : 13,
  CopywriteInfringement : 14
};
BWL.ModelEnum.DomainProfileRoleEnum = {
  Public : 0,
  Authenticated : 10,
  Member : 20,
  Explicit : 30,
  StoreOwner : 40,
  Employee : 70,
  Service : 90,
  Administrator : 100,
  NoAccess : -1
};
BWL.ModelEnum.ExternalInfoEnum = {
  None : 0,
  Facebook : 1,
  LastFM : 2,
  LinkedIn : 3,
  MySpace : 4,
  Twitter : 5,
  YouTube : 6,
  Flickr : 7
};
BWL.ModelEnum.FacebookTypeEnum = {
  None : 0,
  Page : 1,
  Profile : 2
};
BWL.ModelEnum.FeeTypeEnum = {
  None : 0,
  Fixed : 1,
  Precent : 2
};
BWL.ModelEnum.GenderEnum = {
  None : 0,
  Female : 1,
  Male : 2,
  Other : 3
};
BWL.ModelEnum.ItemInfoEnum = {
  None : 0,
  GeneralAdmissionTicket : 100
};
BWL.ModelEnum.LastFMTypeEnum = {
  None : 0,
  Artist : 1,
  User : 2
};
BWL.ModelEnum.LinkedInTypeEnum = {
  None : 0,
  Profile : 1,
  Group : 2,
  Company : 3
};
BWL.ModelEnum.MessageLevelEnum = {
  Message : 0,
  Notify : 1,
  Error : 2
};
BWL.ModelEnum.MessageTypeEnum = {
  None : 0,
  Text : 1,
  HTML : 2
};
BWL.ModelEnum.ModelAccessTypeEnum = {
  Public : 0,
  ReadOnly : 1,
  ReadWrite : 15,
  FullAccess : 31,
  NoAccess : -1
};
BWL.ModelEnum.OrderStateEnum = {
  None : 0,
  New : 1,
  Processing : 2,
  Backordered : 3,
  Ordered : 4,
  Shipped : 5,
  Returned : 6,
  Fulfilled : 7,
  Closed : 8
};
BWL.ModelEnum.PaymentSessionStateEnum = {
  None : 0,
  New : 1,
  Pending : 2,
  Error : 3,
  Canceled : 4,
  Declined : 5,
  Approved : 6
};
BWL.ModelEnum.ServiceInvoiceItemStateEnum = {
  None : 0,
  Pending : 1,
  Invoiced : 2,
  Refunded : 3,
  Canceled : 4,
  Paid : 5
};
BWL.ModelEnum.ServiceInvoiceStateEnum = {
  None : 0,
  Pending : 1,
  Invoiced : 2,
  Refunded : 3,
  Canceled : 4,
  Paid : 5
};
BWL.ModelEnum.TransactionStateEnum = {
  None : 0,
  New : 1,
  Pending : 2,
  Error : 3,
  Canceled : 4,
  Declined : 5,
  Approved : 6
};
