//Working
import { useState } from "react";

export default function PaymentStep({ active }) {
  const [card, setCard] = useState({
    number: "",
    expiry: "",
    cvc: "",
  });

  /* ================= COLLAPSED VIEW ================= */
  if (!active) {
    return (
      <section className="pb-4">
        <Header step={3} title="Payment" />
      </section>
    );
  }

  /* ================= ACTIVE VIEW ================= */
  return (
    <section>
      <Header step={3} title="Payment" />

      {/* PAYMENT BOX */}
      <div className="mt-4">
        <div className="border rounded p-4 bg-[#f5f5f5] pb-[35px]">
          {/* METHOD */}
          <label className="flex items-center gap-2 text-sm font-medium mb-4">
            <input type="radio" defaultChecked />
            Map
          </label>

          {/* CARD FORM */}
          <div className="flex flex-col md:grid grid-cols-[auto] md:grid-cols-2 gap-4 text-sm md:pl-[58.5px] pl-[0] pr-[0] md:pr-[29.5px]">
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">
                Card number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="1234 1234 1234 1234"
                  value={card.number}
                  onChange={(e) =>
                    setCard({ ...card, number: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 pr-24"
                />
                <div className="absolute right-2 top-[50%] translate-y-[-50%] flex gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" fill="none" viewBox="0 0 24 16" class="p-Logo p-Logo--md p-CardBrandIcon h-[17px]"><g clip-path="url(#clip0_4934_35103)"><path fill="#00579f" d="M22 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2"></path><path fill="#fff" d="M10.367 10.91H8.85l.949-5.802h1.517zm5.501-5.66a3.8 3.8 0 0 0-1.36-.247c-1.5 0-2.555.79-2.561 1.92-.013.833.755 1.296 1.33 1.574.587.284.786.469.786.722-.006.389-.474.568-.91.568-.607 0-.931-.092-1.425-.309l-.2-.092-.212 1.302c.356.16 1.012.303 1.692.309 1.593 0 2.63-.778 2.642-1.982.006-.66-.4-1.166-1.274-1.58-.53-.265-.856-.444-.856-.716.006-.247.275-.5.874-.5.493-.012.856.105 1.13.222l.138.062z"></path><path fill="#fff" fill-rule="evenodd" d="M18.584 5.108h1.174l1.224 5.802h-1.405l-.18-.87h-1.95c-.055.154-.318.87-.318.87h-1.592l2.254-5.32c.156-.377.431-.482.793-.482m-.093 2.124-.606 1.623h1.261c-.062-.29-.35-1.679-.35-1.679l-.106-.5a31 31 0 0 1-.2.556" clip-rule="evenodd"></path><path fill="#fff" d="M7.582 5.108 6.096 9.065l-.162-.803c-.275-.926-1.136-1.931-2.098-2.432l1.361 5.074h1.605l2.385-5.796z"></path><path fill="#fff" d="M4.716 5.108H2.275l-.025.118c1.904.481 3.166 1.641 3.684 3.036l-.53-2.666c-.088-.37-.357-.475-.688-.488"></path></g><defs><clipPath id="clip0_4934_35103"><path fill="#fff" d="M0 0h24v16H0z"></path></clipPath></defs></svg>
                  <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false" class="p-Logo p-Logo--md p-CardBrandIcon h-[17px]"><rect fill="#252525" height="16" rx="2" width="24"></rect><circle cx="9" cy="8" fill="#eb001b" r="5"></circle><circle cx="15" cy="8" fill="#f79e1b" r="5"></circle><path d="M12 4c1.214.912 2 2.364 2 4s-.786 3.088-2 4c-1.214-.912-2-2.364-2-4s.786-3.088 2-4z" fill="#ff5f00"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" fill="none" viewBox="0 0 24 16" class="p-Logo p-Logo--md p-CardBrandIcon h-[17px]"><g clip-path="url(#clip0_4934_35113)"><path fill="#0193ce" d="M22 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2"></path><path fill="#fff" d="m19.127 8.063 2.278-2.333h-3.037l-.823.883-.696-.883h-3.505v.63h3.252l.949 1.135L18.62 6.36h1.139l-1.646 1.703 1.646 1.575h-1.14l-1.075-1.133-.986 1.133h-3.215v.632h3.505l.696-.883.823.883h3.037z"></path><path fill="#fff" d="M14.19 9.009h1.9l.885-.946-.76-.946h-2.024v.63h1.772v.631H14.19z"></path><path fill="#fff" fill-rule="evenodd" d="m5.478 9.514-.262.756H2.595l2.228-4.54h2.102l.258.504V5.73h2.621l.525 1.261.524-1.261h2.49v4.54h-1.972v-.63l-.256.63H9.542l-.262-.63v.63H6.396l-.262-.756zm6.424.126h.782l.004-3.28h-1.31l-1.05 2.27L9.28 6.36H7.97v3.027L6.395 6.36H5.347L3.774 9.64h.918l.262-.757h1.704l.262.757h1.836V7.117l1.18 2.523h.786l1.18-2.523zM6.396 8.252l-.524-1.387-.656 1.387z" clip-rule="evenodd"></path></g><defs><clipPath id="clip0_4934_35113"><path fill="#fff" d="M0 0h24v16H0z"></path></clipPath></defs></svg>
                  <svg viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation" focusable="false" class="p-Logo p-Logo--md p-CardBrandIcon p-CardBrandIcon--visible h-[17px]"><path d="M21.997 15.75H22c.955.008 1.74-.773 1.751-1.746V2.006a1.789 1.789 0 0 0-.52-1.25A1.72 1.72 0 0 0 21.997.25H2.001A1.718 1.718 0 0 0 .77.757c-.33.33-.517.779-.521 1.247v11.99c.004.47.191.92.52 1.25.329.328.771.51 1.233.506h19.994Zm0 .5h-.002.002Z" stroke="#ddd" fill="#fff"></path><path d="M12.612 16h9.385A1.986 1.986 0 0 0 24 14.03v-2.358A38.74 38.74 0 0 1 12.612 16Z" fill="#F27712"></path><path d="M23.172 9.296h-.852l-.96-1.266h-.091v1.266h-.695V6.152H21.6c.803 0 1.266.33 1.266.927 0 .488-.29.802-.81.902l1.116 1.315Zm-1.026-2.193c0-.306-.232-.463-.662-.463h-.215v.952h.199c.446 0 .678-.166.678-.489Zm-4.005-.951h1.97v.53h-1.275v.703h1.225v.538h-1.225v.852h1.274v.53h-1.97V6.152Zm-2.235 3.227L14.4 6.143h.761l.952 2.119.96-2.119h.745L16.295 9.38h-.389Zm-6.298-.008c-1.059 0-1.887-.72-1.887-1.655 0-.91.845-1.647 1.904-1.647.298 0 .546.058.852.19v.729a1.241 1.241 0 0 0-.869-.356c-.662 0-1.167.48-1.167 1.084 0 .637.497 1.092 1.2 1.092.315 0 .555-.1.836-.347v.728a2.13 2.13 0 0 1-.869.182ZM7.506 8.336c0 .613-.505 1.035-1.233 1.035-.53 0-.91-.182-1.233-.596l.455-.389c.157.282.422.422.753.422.315 0 .538-.19.538-.438 0-.141-.066-.249-.207-.331a2.88 2.88 0 0 0-.48-.183c-.653-.206-.877-.43-.877-.868 0-.514.48-.903 1.109-.903.397 0 .753.125 1.051.356l-.364.414a.761.761 0 0 0-.563-.248c-.298 0-.513.149-.513.347 0 .166.124.257.538.398.794.248 1.026.48 1.026.993v-.009ZM4.088 6.152h.695v3.153h-.695V6.152ZM1.854 9.305H.828V6.152h1.026c1.125 0 1.903.645 1.903 1.572 0 .472-.231.919-.637 1.217-.348.248-.737.364-1.274.364h.008Zm.81-2.367c-.23-.182-.496-.248-.95-.248h-.191v2.085h.19c.447 0 .728-.083.952-.248.24-.199.38-.497.38-.803 0-.306-.14-.596-.38-.786Z" fill="#000"></path><path d="M12.414 6.069c-.91 0-1.655.728-1.655 1.63 0 .96.711 1.68 1.655 1.68a1.64 1.64 0 0 0 1.655-1.655c0-.927-.72-1.655-1.655-1.655Z" fill="#F27712"></path></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Expiration date
              </label>
              <input
                type="text"
                placeholder="MM / YY"
                value={card.expiry}
                onChange={(e) =>
                  setCard({ ...card, expiry: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Security code
              </label>
              <input
                type="text"
                placeholder="CVC"
                value={card.cvc}
                onChange={(e) =>
                  setCard({ ...card, cvc: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* SECURITY TEXT */}
          <div className="flex items-center gap-2 mt-[24px] text-[14px] md:text-[16px] text-gray-600 pl-0 md:pl-[58.5px] pr-[29.5px]">
            🔒 Paiement sécurisé – Vos informations sont 100% confidentielles.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= SHARED HEADER ================= */

function Header({ step, title }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="nr-step-hed-wr flex items-center gap-2 font-[700] text-[25px] text-[#333]">
        <span className="flex items-center justify-center rounded-full border-[2px] text-[20px] font-[400] border-[#333] h-[35px] w-[35px]">
          {step}
        </span>
        {title}
      </h2>
    </div>
  );
}

