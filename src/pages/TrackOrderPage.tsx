import React, { useState, useEffect } from 'react';
import { 
  Search, PackageCheck, Clock, CheckCircle2, XCircle, 
  Truck, ShieldCheck, FileText, MessageSquare, AlertCircle, 
  ExternalLink, ArrowRight, Building, Copy, Check 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { storeService } from '../services/storeService';
import { Order } from '../types';
import { updateSEO } from '../utils/seo';

interface TrackOrderPageProps {
  initialOrderNumber?: string;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderNumber }) => {
  const { settings, openWhatsApp, addToast, paymentAccounts } = useStore();

  const [query, setQuery] = useState(initialOrderNumber || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  // Slip upload state
  const [tid, setTid] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    updateSEO({
      title: initialOrderNumber ? `Track Order ${initialOrderNumber}` : 'Track Your Order',
      description: 'Check live parcel dispatch, TCS/Trax courier tracking, and bank payment verification status.',
    });

    if (initialOrderNumber) {
      handleSearch(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleSearch = async (searchTarget?: string) => {
    const term = (searchTarget || query).trim();
    if (!term) return;

    setLoading(true);
    setSearched(true);
    try {
      const found = await storeService.getOrderById(term);
      setOrder(found);
      if (found) {
        if (found.transactionId) setTid(found.transactionId);
        if (found.paymentProofUrl) setProofUrl(found.paymentProofUrl);
      }
    } catch (err) {
      console.error('Search error:', err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      addToast('info', 'Copied', `${fieldName} copied.`);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    setUploading(true);
    try {
      const url = await storeService.uploadPaymentProof(file, order.id);
      setProofUrl(url);
      addToast('success', 'Uploaded', 'New payment slip attached.');
    } catch (err: any) {
      addToast('error', 'Upload Failed', err?.message || 'Could not upload slip.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

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
        addToast('success', 'Submitted', 'Your payment receipt was sent for administrative review.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err?.message || 'Failed to submit proof.');
    } finally {
      setSubmittingProof(false);
    }
  };

  // Determine stage progression
  const getTimelineSteps = (ord: Order) => {
    const isCancelled = ord.orderStatus === 'cancelled';
    const isDelivered = ord.orderStatus === 'completed';
    const isShipped = ord.orderStatus === 'shipped' || isDelivered;
    const isProcessing = ord.orderStatus === 'processing' || isShipped;
    const isConfirmed = ord.orderStatus === 'confirmed' || isProcessing;
    const isPaymentVerified = ord.paymentStatus === 'verified' || ord.verificationStatus === 'verified';

    return [
      {
        title: 'Order Placed',
        desc: `Received on ${new Date(ord.createdAt).toLocaleDateString()}`,
        completed: true,
        current: ord.orderStatus === 'new',
      },
      {
        title: 'Payment Verification',
        desc: isPaymentVerified 
          ? `Verified by Accounts Team` 
          : ord.paymentStatus === 'pending_verification'
          ? 'Slip under review'
          : ord.paymentStatus === 'rejected'
          ? 'Payment slip rejected'
          : 'Awaiting bank transfer',
        completed: isPaymentVerified || ord.paymentMethod === 'cash_on_delivery',
        current: ord.paymentStatus === 'pending_verification',
        warning: ord.paymentStatus === 'rejected',
      },
      {
        title: 'Fragile Packing & Dispatch Prep',
        desc: 'Double-boxed with bubble wrap protection',
        completed: isProcessing,
        current: ord.orderStatus === 'processing',
      },
      {
        title: 'Shipped / In Transit',
        desc: ord.trackingNumber 
          ? `${ord.carrier || 'Courier'}: ${ord.trackingNumber}` 
          : ord.deliveryServiceName,
        completed: isShipped,
        current: ord.orderStatus === 'shipped',
      },
      {
        title: 'Delivered',
        desc: 'Parcel handed over to customer',
        completed: isDelivered,
        current: isDelivered,
      },
    ];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block">
          Dispatch & Verification Status
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-950">
          Track Your Parcel
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
          Enter your Crazy Sale Order ID (e.g., <span className="font-mono font-bold text-stone-900">CS-2026-XXXXX</span>) to monitor payment confirmation, packaging, and delivery tracking.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-stone-200 shadow-sm max-w-2xl mx-auto flex items-center gap-3">
        <Search className="w-5 h-5 text-stone-400 shrink-0 ml-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter Order Number or ID..."
          className="flex-1 text-xs sm:text-sm text-stone-900 bg-transparent outline-none placeholder:text-stone-400 font-mono"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="bg-stone-900 hover:bg-amber-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-colors shrink-0 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Track Order'}
        </button>
      </div>

      {/* Results View */}
      {searched && !order && !loading && (
        <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-900">Order Not Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            We couldn&apos;t find an order matching &ldquo;<span className="font-mono">{query}</span>&rdquo;. Please verify the order number from your confirmation SMS or email.
          </p>
          <button
            onClick={() => openWhatsApp({ text: `Assalam-o-Alaikum, I need help tracking my order with reference: ${query}` })}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:underline pt-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask Support on WhatsApp</span>
          </button>
        </div>
      )}

      {order && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Status Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl font-bold text-stone-900">
                    Order #{order.orderNumber}
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.orderNumber, 'Order Number')}
                    className="p-1 text-stone-400 hover:text-stone-700"
                    title="Copy Order #"
                  >
                    {copiedField === 'Order Number' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} • Customer: {order.customer.fullName}
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 shrink-0">
                {order.orderStatus === 'completed' ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Delivered
                  </span>
                ) : order.orderStatus === 'shipped' ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600" /> Shipped
                  </span>
                ) : order.orderStatus === 'processing' ? (
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-amber-700" /> Packing
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-stone-100 text-stone-800 rounded-full text-xs font-bold">
                    Order Received
                  </span>
                )}
              </div>
            </div>

            {/* Tracking Progress Timeline */}
            <div className="py-4">
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-6">
                Delivery Milestones
              </h4>

              <div className="relative border-l-2 border-stone-200 ml-4 pl-6 space-y-8">
                {getTimelineSteps(order).map((step, idx) => (
                  <div key={idx} className="relative">
                    <div 
                      className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                        step.warning
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : step.completed
                          ? 'bg-stone-900 border-stone-900 text-white'
                          : step.current
                          ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                          : 'bg-white border-stone-300 text-stone-300'
                      }`}
                    >
                      {step.completed ? '✓' : idx + 1}
                    </div>

                    <div>
                      <h5 className={`text-xs font-bold ${step.completed ? 'text-stone-900' : 'text-stone-500'}`}>
                        {step.title}
                      </h5>
                      <p className="text-[11px] text-stone-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carrier / Bilty Details if Shipped */}
            {order.trackingNumber && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1 text-xs">
                <span className="font-bold text-blue-900 block">Courier / Cargo Tracking Details:</span>
                <p className="text-blue-800">
                  <span className="font-semibold">Service:</span> {order.carrier || order.deliveryServiceName}
                </p>
                <p className="font-mono text-blue-900">
                  <span className="font-sans font-semibold">Tracking # / Bilty:</span> {order.trackingNumber}
                </p>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-900 font-bold underline mt-1"
                  >
                    <span>Track on Courier Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Payment Verification & Proof Status */}
          {order.paymentMethod === 'advance_bank_transfer' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="font-serif text-base sm:text-lg font-bold text-stone-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-700" />
                  Advance Payment Verification
                </h3>

                {order.paymentStatus === 'verified' ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Verified by Accounts
                  </span>
                ) : order.paymentStatus === 'rejected' ? (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                    Payment Issue / Rejected
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    Awaiting Verification
                  </span>
                )}
              </div>

              {/* If Rejected: Show rejection reason and re-upload */}
              {order.paymentStatus === 'rejected' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                  <span className="font-bold block flex items-center gap-1.5 text-rose-800">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Notice from Accounts Department:
                  </span>
                  <p>{order.rejectionReason || 'Receipt details do not match the order total or bank records.'}</p>
                  <p className="text-stone-600 pt-1">
                    Please upload an updated transaction slip or contact our WhatsApp desk for assistance.
                  </p>
                </div>
              )}

              {/* If Verified: Show verification note */}
              {order.paymentStatus === 'verified' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Payment Confirmed
                  </div>
                  <p>
                    Verified by <span className="font-semibold">{order.verifiedBy || 'Store Accounts'}</span> on{' '}
                    {order.verifiedDate ? new Date(order.verifiedDate).toLocaleDateString() : 'Confirmation'}.
                  </p>
                </div>
              )}

              {/* If Not Verified: Allow user to upload or re-upload */}
              {order.paymentStatus !== 'verified' && (
                <form onSubmit={handleSubmitProof} className="p-5 rounded-2xl border border-stone-200 bg-stone-50 space-y-4">
                  <h4 className="text-xs font-bold text-stone-900">
                    {order.paymentProofUrl ? 'Upload Revised Payment Proof' : 'Upload Bank Transfer Receipt / Slip'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Bank Transaction ID (TID)
                      </label>
                      <input
                        type="text"
                        value={tid}
                        onChange={(e) => setTid(e.target.value)}
                        placeholder="e.g. 948190281"
                        className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Receipt Image Screenshot
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-amber-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  {uploading && (
                    <p className="text-xs text-amber-700 animate-pulse font-medium">
                      Uploading screenshot...
                    </p>
                  )}

                  {proofUrl && (
                    <div className="flex items-center gap-2 text-xs text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Receipt screenshot attached</span>
                      <a href={proofUrl} target="_blank" rel="noreferrer" className="underline font-semibold ml-2">
                        Preview
                      </a>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingProof || uploading}
                    className="px-5 py-2 bg-stone-900 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {submittingProof ? 'Saving...' : 'Submit Payment Proof'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Order Summary & WhatsApp */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div>
              <p className="font-bold text-stone-900">
                Order Total: {settings.currencySymbol} {order.total.toLocaleString()} ({order.items.length} items)
              </p>
              <p className="text-stone-500 mt-0.5">
                Dispatch destination: {order.customer.city}, Pakistan
              </p>
            </div>

            <button
              onClick={() =>
                openWhatsApp({
                  orderNumber: order.orderNumber,
                  text: `Assalam-o-Alaikum, I am inquiring about Order #${order.orderNumber} for ${order.customer.fullName}.`,
                })
              }
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Inquire on WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
