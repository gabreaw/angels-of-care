export const getWhatsAppLink = (message = "") => {
  const phoneNumber = import.meta.env.VITE_WHATSAPP_PHONE || "5549984220162";
  const text =
    message ||
    "Olá! Acessei o site da Angels of Care e gostaria de mais informações sobre os serviços.";
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${phoneNumber}?text=${encodedText}`;
};
