import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Building, Copy, Check, Upload, MessageSquare, 
  ArrowRight, ShieldCheck, Truck, FileText, ExternalLink, Clock, AlertCircle 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/Router';
import { storeService } from '../services/storeService';
import { Order } from '../types';
import { updateSEO } from '../utils/seo';

interface OrderSuccessPageProps {
  orderNumber: string;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderNumber }) => {
  const { settings, paymentAccounts, openWhatsApp, addToast } = useStore();
  const { navigate } = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload proof form state
  const [tid, setTid] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    updateSEO({
      title: `Order Received - ${orderNumber}`,
      description: 'Thank you for your order with Crazy Sale. Review your order summary and bank payment transfer details.',
    });

    const loadOrder = async () => {
      setLoading(true);
      try {
        const found = await storeService.getOrderById(orderNumber);
        setOrder(found);
        if (found?.transactionId) setTid(found.transactionId);
        if (found?.paymentProofUrl) setProofUrl(found.paymentProofUrl);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderNumber]);

  const copyToClipboard = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      addToast('info', 'Copied', `${fieldName} copied to clipboard.`);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    if (file.size > 8 * 1024 * 1024) {
      addToast('error', 'File Too Large', 'Please upload an image under 8MB.');
      return;
    }

    setUploading(true);
    try {
      const url = await storeService.uploadPaymentProof(file, order.id);
      setProofUrl(url);
      addToast('success', 'Screenshot Uploaded', 'Receipt screenshot is ready to submit.');
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Upload Error', err?.message || 'Failed to upload receipt.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!tid.trim() && !proofUrl) {
      addToast('error', 'Incomplete', 'Please provide either a Transaction ID or upload your receipt slip.');
      return;
    }

    setSubmittingProof(true);
    try {
      const updated = await storeService.submitPaymentProof(order.id, {
        transactionId: tid.trim() || 'SUBMITTED_SLIP',
        paidAmount: order.total,
        paymentProofUrl: proofUrl,
        paymentNotes: notes.trim(),
      });

      if (updated) {
        setOrder(updated);
        addToast('success', 'Proof Submitted', 'Your payment receipt was submitted for administrative verification.');
      }
    } catch (err: any) {
      console.error('Proof submission error:', err);
      addToast('error', 'Submission Error', err?.message || 'Failed to submit payment details.');
    } finally {
      setSubmittingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-medium">Fetching order confirmation...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-stone-900">Order Not Found</h2>
        <p className="text-xs text-stone-500">We couldn&apos;t locate Order #{orderNumber}. Please check your order number.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="bg-stone-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const primaryBank = order.selectedBank || paymentAccounts.find(b => b.isDefault) || paymentAccounts[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* 1. Success Hero Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">
          Order Successfully Placed
        </span>

        <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-950">
          Thank You, {order.customer.fullName}!
        </h1>

        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
          Your order has been recorded in our system. A confirmation email has been sent to{' '}
          <span className="font-semibold text-stone-900">{order.customer.email}</span>.
        </p>

        <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
          <span className="text-xs text-stone-500 font-medium">Your Order Tracking Number:</span>
          <span className="text-sm font-mono font-bold text-stone-900 bg-white px-3 py-1 rounded-lg border border-stone-200 select-all">
            {order.orderNumber}
          </span>
          <button
            onClick={() => copyToClipboard(order.orderNumber, 'Order Number')}
            className="p-1 text-stone-500 hover:text-stone-900"
            title="Copy Order #"
          >
            {copiedField === 'Order Number' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() =>
              openWhatsApp({
                orderNumber: order.orderNumber,
                text: `Assalam-o-Alaikum Crazy Sale! I have placed Order #${order.orderNumber} for PKR ${order.total.toLocaleString()}. Please confirm receipt and dispatch schedule.`,
              })
            }
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Confirm Order on WhatsApp</span>
          </button>

          <button
            onClick={() => navigate(`/track/${order.orderNumber}`)}
            className="flex items-center gap-2 bg-stone-900 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <span>Track Order & Delivery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Bank Transfer Verification Section (If Advance Bank Transfer) */}
      {order.paymentMethod === 'advance_bank_transfer' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                Advance Payment Instructions
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-950 mt-0.5">
                Bank Transfer Details & Slip Upload
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Please transfer the exact amount of <strong className="text-stone-900">{settings.currencySymbol} {order.total.toLocaleString()}</strong> to the official bank account below.
              </p>
            </div>

            {/* Current verification badge */}
            <div className="shrink-0">
              {order.paymentStatus === 'verified' ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payment Verified
                </span>
              ) : order.paymentStatus === 'pending_verification' ? (
                <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" /> Slip Under Review
                </span>
              ) : (
                <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
                  Awaiting Transfer
                </span>
              )}
            </div>
          </div>

          {/* Bank Account Details Card */}
          {primaryBank && (
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-amber-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-700" />
                  {primaryBank.bankName}
                </span>
                <span className="text-[11px] font-mono bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-bold">
                  Branch: {primaryBank.branchName} ({primaryBank.branchCode})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">Account Title</span>
                    <span className="font-bold text-stone-900 select-all">{primaryBank.accountTitle}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(primaryBank.accountTitle, 'Account Title')}
                    className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-50"
                  >
                    {copiedField === 'Account Title' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">Account Number</span>
                    <span className="font-bold text-stone-900 font-mono select-all">{primaryBank.accountNumber}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(primaryBank.accountNumber, 'Account Number')}
                    className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-50"
                  >
                    {copiedField === 'Account Number' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between sm:col-span-2">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">IBAN Number (1Link / RAAST)</span>
                    <span className="font-bold text-stone-900 font-mono text-xs select-all">
                      {primaryBank.iban}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(primaryBank.iban, 'IBAN')}
                    className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-50"
                  >
                    {copiedField === 'IBAN' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-stone-600 italic">
                {primaryBank.instructions}
              </p>
            </div>
          )}

          {/* Slip Submission Form */}
          <form onSubmit={handleSubmitProof} className="p-5 rounded-2xl border border-stone-200 bg-stone-50 space-y-4">
            <h3 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-500" />
              {order.paymentProofUrl ? 'Update or Re-upload Payment Receipt' : 'Upload Bank Transfer Slip / Screenshot'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Bank Transaction ID (TID / Reference)
                </label>
                <input
                  type="text"
                  value={tid}
                  onChange={(e) => setTid(e.target.value)}
                  placeholder="e.g. 948190281"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Deposit Receipt Screenshot
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-stone-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-amber-700 cursor-pointer"
                />
              </div>
            </div>

            {uploading && (
              <p className="text-xs text-amber-700 animate-pulse font-medium">
                Uploading slip screenshot...
              </p>
            )}

            {proofUrl && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="flex-1 text-emerald-900 font-medium">Receipt screenshot attached</span>
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-800 underline font-semibold flex items-center gap-1"
                >
                  <span>View Slip</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Notes for Accounts Dept (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Transferred via Meezan App from Tariq's account."
                className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingProof || uploading}
              className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {submittingProof ? 'Saving Verification Proof...' : 'Submit Receipt for Verification'}
            </button>
          </form>
        </div>
      )}

      {/* 3. Order Items & Delivery Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs space-y-6">
        <h3 className="font-serif text-lg font-bold text-stone-950 pb-3 border-b border-stone-100">
          Parcel & Items Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Recipient Details */}
          <div className="space-y-1.5 text-stone-600 bg-stone-50 p-4 rounded-2xl">
            <span className="font-bold text-stone-900 block mb-1">Delivery Address:</span>
            <p className="font-semibold text-stone-800">{order.customer.fullName}</p>
            <p>{order.customer.address}</p>
            <p>{order.customer.city}, Pakistan</p>
            <p className="font-mono text-stone-800 pt-1">Phone: {order.customer.phone}</p>
          </div>

          {/* Delivery & Transit Service */}
          <div className="space-y-1.5 text-stone-600 bg-stone-50 p-4 rounded-2xl">
            <span className="font-bold text-stone-900 block mb-1">Transit Details:</span>
            <p><span className="font-medium text-stone-700">Method:</span> {order.deliveryServiceName}</p>
            <p><span className="font-medium text-stone-700">Est. Timeframe:</span> {order.deliveryTime}</p>
            <p><span className="font-medium text-stone-700">Parcel Weight:</span> {order.totalWeightKg} KG</p>
            <p><span className="font-medium text-stone-700">Payment:</span> {order.paymentMethod === 'advance_bank_transfer' ? 'Advance Bank Transfer' : 'Cash on Delivery'}</p>
          </div>
        </div>

        {/* Items List */}
        <div className="divide-y divide-stone-100 pt-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover bg-stone-100"
                />
                <div>
                  <p className="font-bold text-stone-900">{item.productTitle}</p>
                  {item.variantName && <p className="text-stone-500 text-[11px]">{item.variantName}</p>}
                  <p className="text-stone-400 text-[10px]">
                    Qty: {item.quantity} • SKU: {item.sku}
                  </p>
                </div>
              </div>

              <span className="font-bold text-stone-900">
                {settings.currencySymbol} {item.lineSubtotal.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal:</span>
            <span className="font-bold text-stone-900">{settings.currencySymbol} {order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Shipping / Cargo Fee:</span>
            <span className="font-bold text-stone-900">
              {order.shipping === 0 ? 'FREE (0 PKR)' : `${settings.currencySymbol} ${order.shipping.toLocaleString()}`}
            </span>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-stone-950 pt-2 border-t border-stone-100">
            <span>Grand Total:</span>
            <span className="text-base">{settings.currencySymbol} {order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
