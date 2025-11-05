"use client";
import Image from "next/image";
import React from "react";

export default function ReceiptModal({ receipt, onClose }: any) {
  if (!receipt) return null;

  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white p-8 rounded-2xl shadow-lg w-[650px] text-black text-sm font-mono"
        id="printable-receipt"
      >
        {/* Header */}
        <div className="flex items-center justify-center space-x-3 mb-2">
          <Image
            src="/ashirov-logo.jpg"
            alt="ashirov-logo"
            width={55}
            height={55}
            className="rounded"
          />
          <h1 className="font-bold text-xl text-center">Ashirov Technology</h1>
        </div>

        {/* Business Details */}
        <p className="text-center text-xs mb-3 leading-tight">
          Suite 045 Orago (Lozumba) Commercial Complex, Kam Salem Street, Area 10, Garki Abuja FCT
          <br />
          <span className="font-semibold">Account Name:</span> ASHIROV TECHNOLOGY <br />
          <span className="font-semibold">Bank:</span> Moniepoint MFB <br />
          <span className="font-semibold">Account Number:</span> 5374867746
        </p>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Customer Info */}
        <div className="text-xs mb-2 space-y-1">
          <p>
            <strong>Date:</strong> {receipt.date}
          </p>
          <p>
            <strong>Customer:</strong> {receipt.customer}
          </p>
          <p>
            <strong>Seller:</strong> {receipt.seller}
          </p>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Items Table */}
        <table className="w-full text-xs mb-3">
          <thead>
            <tr className="border-b border-dashed border-gray-400">
              <th className="text-left">Item</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Price</th>
               <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item: any, i: number) => (
              <tr key={i}>
                <td>{item.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">₦{(item.price).toLocaleString()}</td>
                <td className="text-right">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Summary */}
        <div className="flex justify-between mb-1">
          <span>Subtotal:</span>
          <span>
            ₦
            {(
              receipt.subtotal ??
              receipt.total + (receipt.discount ?? 0)
            ).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between mb-1">
          <span>Discount:</span>
          <span>₦{(receipt.discount ?? 0).toLocaleString()}</span>
        </div>

        <div className="flex justify-between font-bold text-base border-t border-dashed border-gray-400 pt-1">
          <span>Total:</span>
          <span>₦{(receipt.total ?? 0).toLocaleString()}</span>
        </div>

        <div className="border-t border-dashed border-gray-400 my-4"></div>

        {/* Terms & Conditions */}
        <div className="text-xs leading-relaxed mb-3 space-y-1">
          <p className="font-semibold underline">Terms & Conditions:</p>
          <p>1. No refund of money after payment.</p>
          <p>2. 10% service charge applies if a customer requests a refund instead of a replacement (in case of warranty).</p>
          <p>3. Goods received in good condition.</p>
          <p>4. 30 days warranty from the date of purchase.</p>
          <p>5. Warranty valid only upon presentation of receipt.</p>
        </div>

        <div className="flex justify-between text-xs mt-4 mb-2">
          <p>Customer Signature: ____________________</p>
          <p>Authorized Signature: ____________________</p>
        </div>

        <p className="text-center text-xs mt-6">
          Thank you for shopping with us! 🙏 <br />
          We appreciate your business.
        </p>

        <div className="text-center space-x-3 mt-4">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition"
          >
            Print
          </button>

          
          <button
            onClick={onClose}
            className="bg-gray-700 text-white px-4 py-1.5 rounded hover:bg-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx global>{`
  @media print {
  
   

    #printable-receipt {
      
      width: 90%;
      transform: scale(1); /* Increase overall print size */
      transform-origin: top left;
      font-size: 18px !important; /* Make text bigger */
      padding: 30px !important;
    }

   

    
  }
`}</style>

    </div>
  );
}
