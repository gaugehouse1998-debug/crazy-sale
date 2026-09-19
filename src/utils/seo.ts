export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  canonicalUrl?: string;
  structuredData?: object;
}

export function updateSEO({
  title,
  description,
  image,
  type = 'website',
  canonicalUrl,
  structuredData,
}: SEOProps) {
  const storeName = 'Crazy Sale';
  const fullTitle = title ? `${title} | ${storeName} - Crockery & Home Decor` : `${storeName} - Beautiful Crockery & Decoration at Crazy Prices`;
  const defaultDesc = 'Shop luxury dinner sets, tea sets, kitchenware, crystal glassware, and home decoration at Crazy Prices in Pakistan. Fast nationwide delivery & secure advance payment.';
  const effectiveDesc = description || defaultDesc;

  document.title = fullTitle;

  // Meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', effectiveDesc);

  // OpenGraph tags
  const setMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('og:title', fullTitle);
  setMeta('og:description', effectiveDesc);
  setMeta('og:type', type);
  if (image) {
    setMeta('og:image', image);
  }

  // Canonical tag
  let linkCanonical = document.querySelector('link[rel="canonical"]');
  if (!linkCanonical) {
    linkCanonical = document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    document.head.appendChild(linkCanonical);
  }
  linkCanonical.setAttribute('content', canonicalUrl || window.location.href);

  // JSON-LD Structured Data
  const scriptId = 'json-ld-structured-data';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (structuredData) {
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(structuredData);
  } else if (script) {
    script.remove();
  }
}
