export const DEMO_MODE = true;

type SimulationPayload = Record<string, unknown>;

export function simulateSTKPush(payload: SimulationPayload) {
  const response = {
    CheckoutRequestID: `ws_CO_${Date.now()}`,
    MerchantRequestID: `mr_${Date.now()}`,
    ResponseCode: '0',
    ResponseDescription: 'Demo STK push accepted',
    CustomerMessage: 'Success. Request accepted for processing.',
    payload,
  };

  console.log('[M-Pesa Demo] simulateSTKPush', response);
  return response;
}

export function simulateC2B(payload: SimulationPayload) {
  const response = {
    ConversationID: `c2b_${Date.now()}`,
    OriginatorConversationID: `oc2b_${Date.now()}`,
    ResponseCode: '0',
    ResponseDescription: 'Demo C2B request processed successfully',
    payload,
  };

  console.log('[M-Pesa Demo] simulateC2B', response);
  return response;
}

export function simulateB2B(payload: SimulationPayload) {
  const response = {
    ConversationID: `b2b_${Date.now()}`,
    OriginatorConversationID: `ob2b_${Date.now()}`,
    ResponseCode: '0',
    ResponseDescription: 'Demo B2B request processed successfully',
    payload,
  };

  console.log('[M-Pesa Demo] simulateB2B', response);
  return response;
}