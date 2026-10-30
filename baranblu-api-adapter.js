// Baran Blü — adaptador GitHub Pages -> Apps Script
// Permite mantener casi intacto el HTML actual que usa google.script.run.

(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycby0swn4fy9EU8uTLYteaNAEqiEc8Ye6sc5iw9SD9QDSB9vWCd-SrhXam8bbeooIG7b00w/exec";

  async function apiGet(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.set("api", action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (!json.ok) throw new Error(json.error || "Error de API");
    return json.data;
  }

  async function apiPost(action, data) {
    const response = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({ action, data })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (!json.ok) throw new Error(json.error || "Error de API");
    return json.data;
  }

  function makeRunner() {
    let successHandler = function () {};
    let failureHandler = function (err) { console.error(err); };

    const runner = {
      withSuccessHandler(fn) {
        successHandler = typeof fn === "function" ? fn : successHandler;
        return runner;
      },
      withFailureHandler(fn) {
        failureHandler = typeof fn === "function" ? fn : failureHandler;
        return runner;
      },
      getDisponibilidad(fecha, hora, personas) {
        apiGet("disponibilidad", { fecha, hora, personas })
          .then(successHandler)
          .catch(failureHandler);
      },
      getWhatsappNumero() {
        apiGet("whatsapp")
          .then(successHandler)
          .catch(failureHandler);
      },

      getFechasCerradasPublicas() {
        apiGet("cierres")
          .then(successHandler)
          .catch(failureHandler);
      },
      getRequiereDeposito() {
        apiGet("requiereDeposito")
          .then(successHandler)
          .catch(failureHandler);
      },
      crearReserva(datos) {
        apiPost("crearReserva", datos)
          .then(successHandler)
          .catch(failureHandler);
      },
      confirmarPago() {
        failureHandler(new Error(
          "confirmarPago no está habilitado en la versión pública. Actualmente Baran Blü no requiere depósito."
        ));
      }
    };

    return runner;
  }

  // Emula la interfaz google.script.run usada por el HTML actual.
  window.google = window.google || {};
  window.google.script = window.google.script || {};

  Object.defineProperty(window.google.script, "run", {
    configurable: true,
    get() {
      return makeRunner();
    }
  });
})();
