"use strict";

const supabaseClient = window.supabaseClient;

const state = {
  settings: null,
  rechargeRequests: [],
  withdrawalRequests: [],
  profiles: [],
  orders: [],
  transactions: [],
  financialStats: {
    deposits: 0,
    withdrawals: 0,
    fees: 0,
    circulation: 0
  }
};

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function formatMoney(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showLoginMessage(message, isError = false) {
  const element =
    document.getElementById("loginMessage");

  if (!element) return;

  element.textContent = message;
  element.style.display = message ? "block" : "none";
  element.classList.toggle("error", isError);
}

function showAdminPage() {
  const loginPage =
    document.getElementById("loginPage");

  const adminPage =
    document.getElementById("adminPage");

  if (loginPage) {
    loginPage.style.display = "none";
  }

  if (adminPage) {
    adminPage.style.display = "block";
  }
}

function showLoginPage() {
  const loginPage =
    document.getElementById("loginPage");

  const adminPage =
    document.getElementById("adminPage");

  if (loginPage) {
    loginPage.style.display = "flex";
  }

  if (adminPage) {
    adminPage.style.display = "none";
  }
}

async function loadSettings() {
  try {
    const { data, error } =
      await supabaseClient
        .from("macheya_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

    if (error) throw error;

    state.settings = data || {};

    const fee =
      document.getElementById("feePercentage");

    const moncash =
      document.getElementById("moncashNumber");

    const natcash =
      document.getElementById("natcashNumber");

    if (fee) {
      fee.value =
        data?.fee_percentage ?? 0;
    }

    if (moncash) {
      moncash.value =
        data?.moncash_number ?? "";
    }

    if (natcash) {
      natcash.value =
        data?.natcash_number ?? "";
    }

  } catch (error) {
    console.error(
      "Settings error:",
      error
    );
  }
}

async function saveSettings() {
  const fee =
    document.getElementById("feePercentage");

  const moncash =
    document.getElementById("moncashNumber");

  const natcash =
    document.getElementById("natcashNumber");

  const message =
    document.getElementById("settingsMessage");

  if (!fee || !moncash || !natcash) {
    return;
  }

  const feeValue =
    Number(fee.value);

  if (
    Number.isNaN(feeValue) ||
    feeValue < 0 ||
    feeValue > 100
  ) {
    if (message) {
      message.textContent =
        "Pousantaj la dwe ant 0 ak 100.";
      message.style.display = "block";
    }

    return;
  }

  try {
    const {
      data: { user },
      error: userError
    } =
      await supabaseClient.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        "Ou pa konekte kòm admin."
      );
    }

    const settings = {
      id: 1,
      fee_percentage: feeValue,
      moncash_number:
        moncash.value.trim(),
      natcash_number:
        natcash.value.trim(),
      updated_by: user.id,
      updated_at:
        new Date().toISOString()
    };

    const { error } =
      await supabaseClient
        .from("macheya_settings")
        .upsert(settings);

    if (error) {
      throw error;
    }

    state.settings = {
      ...settings
    };

    if (message) {
      message.textContent =
        "Paramèt yo sove avèk siksè.";
      message.style.display = "block";
      message.classList.remove("error");
    }

  } catch (error) {
    console.error(
      "Save settings error:",
      error
    );

    if (message) {
      message.textContent =
        error.message ||
        "Pa kapab sove paramèt yo.";
      message.style.display = "block";
      message.classList.add("error");
    }
  }
}

async function loadProfiles() {
  try {
    const { data, error } =
      await supabaseClient
        .from("profiles")
        .select("*");

    if (error) {
      throw error;
    }

    state.profiles = data || [];

    const buyers =
      state.profiles.filter(
        profile =>
          profile.role === "acheteur"
      ).length;

    const sellers =
      state.profiles.filter(
        profile =>
          profile.role === "vendeur"
      ).length;

    setText("buyers", buyers);
    setText("sellers", sellers);
    setText(
      "users",
      state.profiles.length
    );

  } catch (error) {
    console.error(
      "Profiles error:",
      error
    );

    setText("buyers", "0");
    setText("sellers", "0");
    setText("users", "0");
  }
}

async function loadOrders() {
  try {
    const { data, error } =
      await supabaseClient
        .from("orders")
        .select("id");

    if (error) {
      throw error;
    }

    state.orders = data || [];

    setText(
      "orders",
      state.orders.length
    );

  } catch (error) {
    console.error(
      "Orders error:",
      error
    );

    setText("orders", "0");
  }
}

async function loadRechargeRequests() {
  const container =
    document.getElementById(
      "rechargeRequests"
    );

  if (!container) return;

  container.innerHTML =
    `<div class="loading">
      Ap chèche demann rechaj...
    </div>`;

  try {
    const { data, error } =
      await supabaseClient
        .from("recharge_requests")
        .select("*")
        .order("created_at", {
          ascending: false
        });

    if (error) {
      throw error;
    }

    state.rechargeRequests =
      data || [];

    if (!state.rechargeRequests.length) {
      container.innerHTML =
        `<div class="empty">
          Pa gen demann rechaj pou kounye a.
        </div>`;

      return;
    }

    container.innerHTML =
      state.rechargeRequests
        .map(request => {

          const amount =
            request.amount ??
            request.montant ??
            request.value ??
            0;

          const method =
            request.method ??
            request.payment_method ??
            request.type ??
            "—";

          const status =
            request.status ??
            "pending";

          const phone =
            request.phone_number ??
            request.phone ??
            request.number ??
            "—";

          const statusClass =
            status === "approved"
              ? "approved"
              : status === "rejected"
                ? "rejected"
                : "pending";

          return `
            <div class="request-card">

              <div>
                <strong>
                  💰 ${formatMoney(amount)} HTG
                </strong>

                <span>
                  ${escapeHTML(method)}
                </span>
              </div>

              <div>
                📱 ${escapeHTML(phone)}
              </div>

              <div>
                <small>
                  ${formatDate(request.created_at)}
                </small>
              </div>

              <div class="request-status ${statusClass}">
                ${escapeHTML(status)}
              </div>

              ${
                status === "pending"
                  ? `
                    <div class="request-actions">

                      <button
                        class="approve-btn"
                        onclick="updateRechargeStatus('${escapeHTML(request.id)}','approved')"
                        type="button"
                      >
                        ✓ Aksepte
                      </button>

                      <button
                        class="reject-btn"
                        onclick="updateRechargeStatus('${escapeHTML(request.id)}','rejected')"
                        type="button"
                      >
                        ✕ Refize
                      </button>

                    </div>
                  `
                  : ""
              }

            </div>
          `;
        })
        .join("");

  } catch (error) {
    console.error(
      "Recharge error:",
      error
    );

    container.innerHTML =
      `<div class="error">
        ${escapeHTML(error.message)}
      </div>`;
  }
}

async function updateRechargeStatus(
  id,
  status
) {
  try {
    const {
      data: request,
      error: fetchError
    } =
      await supabaseClient
        .from("recharge_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!request) {
      throw new Error(
        "Demann rechaj la pa egziste."
      );
    }

    if (
      (request.status || "pending") !==
      "pending"
    ) {
      throw new Error(
        "Demann sa a deja trete."
      );
    }

    const { error } =
      await supabaseClient
        .from("recharge_requests")
        .update({
          status,
          updated_at:
            new Date().toISOString()
        })
        .eq("id", id)
        .eq("status", "pending");

    if (error) {
      throw error;
    }

    await Promise.all([
      loadRechargeRequests(),
      loadFinancialStats()
    ]);

  } catch (error) {
    console.error(
      "Recharge update error:",
      error
    );

    alert(
      error.message ||
      "Pa kapab mete ajou demann rechaj la."
    );
  }
  }
async function loadWithdrawalRequests() {
  const container =
    document.getElementById(
      "withdrawalRequests"
    );

  if (!container) return;

  container.innerHTML =
    `<div class="loading">
      Ap chèche demann retrè...
    </div>`;

  try {
    const { data, error } =
      await supabaseClient
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", {
          ascending: false
        });

    if (error) {
      throw error;
    }

    state.withdrawalRequests =
      data || [];

    if (!state.withdrawalRequests.length) {
      container.innerHTML =
        `<div class="empty">
          Pa gen okenn demann retrè pou kounye a.
        </div>`;

      return;
    }

    container.innerHTML =
      state.withdrawalRequests
        .map(request => {

          const amount =
            request.amount ??
            request.montant ??
            request.value ??
            0;

          const method =
            request.method ??
            request.payment_method ??
            request.type ??
            "—";

          const number =
            request.phone_number ??
            request.phone ??
            request.number ??
            "—";

          const status =
            request.status ||
            "pending";

          const statusClass =
            status === "approved"
              ? "approved"
              : status === "rejected"
                ? "rejected"
                : "pending";

          return `
            <div class="request-card">

              <div>
                <strong>
                  💸 ${formatMoney(amount)} HTG
                </strong>
              </div>

              <div>
                📱 ${escapeHTML(number)}
              </div>

              <div>
                💳 ${escapeHTML(method)}
              </div>

              <div>
                <small>
                  ${formatDate(request.created_at)}
                </small>
              </div>

              <div class="request-status ${statusClass}">
                ${escapeHTML(status)}
              </div>

              ${
                status === "pending"
                  ? `
                    <div class="request-actions">

                      <button
                        class="approve-btn"
                        onclick="updateWithdrawalStatus('${escapeHTML(request.id)}','approved')"
                        type="button"
                      >
                        ✓ Peye
                      </button>

                      <button
                        class="reject-btn"
                        onclick="updateWithdrawalStatus('${escapeHTML(request.id)}','rejected')"
                        type="button"
                      >
                        ✕ Refize
                      </button>

                    </div>
                  `
                  : ""
              }

            </div>
          `;
        })
        .join("");

  } catch (error) {
    console.error(
      "Withdrawal error:",
      error
    );

    container.innerHTML =
      `<div class="error">
        ${escapeHTML(error.message)}
      </div>`;
  }
}


async function updateWithdrawalStatus(
  id,
  status
) {
  try {
    const {
      data: request,
      error: fetchError
    } =
      await supabaseClient
        .from("withdrawal_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!request) {
      throw new Error(
        "Demann retrè a pa egziste."
      );
    }

    if (
      (request.status || "pending") !==
      "pending"
    ) {
      throw new Error(
        "Demann sa a deja trete."
      );
    }

    const { error } =
      await supabaseClient
        .from("withdrawal_requests")
        .update({
          status,
          updated_at:
            new Date().toISOString()
        })
        .eq("id", id)
        .eq("status", "pending");

    if (error) {
      throw error;
    }

    await Promise.all([
      loadWithdrawalRequests(),
      loadFinancialStats(),
      loadWithdrawalChart()
    ]);

  } catch (error) {
    console.error(
      "Withdrawal update error:",
      error
    );

    alert(
      error.message ||
      "Pa kapab mete ajou demann retrè a."
    );
  }
}


async function loadFinancialStats() {
  try {
    let deposits = 0;
    let withdrawals = 0;
    let fees = 0;

    const {
      data: rechargeData,
      error: rechargeError
    } =
      await supabaseClient
        .from("recharge_requests")
        .select("*");

    if (rechargeError) {
      throw rechargeError;
    }

    const approvedRecharges =
      (rechargeData || []).filter(
        request =>
          request.status === "approved"
      );

    deposits =
      approvedRecharges.reduce(
        (total, request) =>
          total +
          Number(
            request.amount ??
            request.montant ??
            request.value ??
            0
          ),
        0
      );


    const {
      data: withdrawalData,
      error: withdrawalError
    } =
      await supabaseClient
        .from("withdrawal_requests")
        .select("*");

    if (withdrawalError) {
      throw withdrawalError;
    }

    const approvedWithdrawals =
      (withdrawalData || []).filter(
        request =>
          request.status === "approved"
      );

    withdrawals =
      approvedWithdrawals.reduce(
        (total, request) =>
          total +
          Number(
            request.amount ??
            request.montant ??
            request.value ??
            0
          ),
        0
      );


    const feePercentage =
      Number(
        state.settings?.fee_percentage ?? 0
      );

    fees =
      approvedWithdrawals.reduce(
        (total, request) => {

          const amount =
            Number(
              request.amount ??
              request.montant ??
              request.value ??
              0
            );

          const requestFee =
            request.fee ??
            request.fee_amount ??
            request.frais;

          if (
            requestFee !== undefined &&
            requestFee !== null
          ) {
            return total +
              Number(requestFee || 0);
          }

          return total +
            (
              amount *
              feePercentage /
              100
            );
        },
        0
      );


    const circulation =
      Math.max(
        0,
        deposits -
        withdrawals
      );

    state.financialStats = {
      deposits,
      withdrawals,
      fees,
      circulation
    };

    setText(
      "deposits",
      `${formatMoney(deposits)} HTG`
    );

    setText(
      "withdrawals",
      `${formatMoney(withdrawals)} HTG`
    );

    setText(
      "fees",
      `${formatMoney(fees)} HTG`
    );

    setText(
      "circulation",
      `${formatMoney(circulation)} HTG`
    );

  } catch (error) {
    console.error(
      "Financial stats error:",
      error
    );
  }
}


async function loadWithdrawalChart() {
  const canvas =
    document.getElementById("chart");

  if (!canvas) return;

  const periodElement =
    document.getElementById("period");

  const period =
    Number(
      periodElement?.value || 30
    );

  try {
    const startDate =
      new Date();

    startDate.setHours(
      0,
      0,
      0,
      0
    );

    startDate.setDate(
      startDate.getDate() -
      (period - 1)
    );

    const {
      data,
      error
    } =
      await supabaseClient
        .from("withdrawal_requests")
        .select(
          "amount,montant,value,created_at,status"
        )
        .eq("status", "approved")
        .gte(
          "created_at",
          startDate.toISOString()
        )
        .order("created_at", {
          ascending: true
        });

    if (error) {
      throw error;
    }

    const dailyTotals = {};

    for (
      let i = 0;
      i < period;
      i++
    ) {
      const date =
        new Date(startDate);

      date.setDate(
        startDate.getDate() + i
      );

      const key =
        date.toISOString()
          .split("T")[0];

      dailyTotals[key] = 0;
    }

    (data || []).forEach(
      request => {

        const created =
          new Date(
            request.created_at
          );

        const key =
          created
            .toISOString()
            .split("T")[0];

        if (
          Object.prototype.hasOwnProperty.call(
            dailyTotals,
            key
          )
        ) {
          dailyTotals[key] +=
            Number(
              request.amount ??
              request.montant ??
              request.value ??
              0
            );
        }
      }
    );

    drawWithdrawalChart(
      canvas,
      dailyTotals
    );

  } catch (error) {
    console.error(
      "Withdrawal chart error:",
      error
    );
  }
  }
function drawWithdrawalChart(
  canvas,
  dailyTotals
) {
  const context =
    canvas.getContext("2d");

  if (!context) return;

  const rect =
    canvas.getBoundingClientRect();

  const width =
    Math.max(
      canvas.clientWidth ||
      rect.width ||
      300,
      300
    );

  const height =
    Math.max(
      canvas.clientHeight ||
      rect.height ||
      260,
      260
    );

  const ratio =
    window.devicePixelRatio || 1;

  canvas.width =
    width * ratio;

  canvas.height =
    height * ratio;

  context.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );

  context.clearRect(
    0,
    0,
    width,
    height
  );

  const entries =
    Object.entries(
      dailyTotals
    );

  const values =
    entries.map(
      item =>
        Number(item[1]) || 0
    );

  const maxValue =
    Math.max(
      ...values,
      1
    );

  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  context.font =
    "11px Arial";

  context.textAlign =
    "right";

  context.textBaseline =
    "middle";

  const gridLines = 4;

  for (
    let i = 0;
    i <= gridLines;
    i++
  ) {
    const y =
      paddingTop +
      chartHeight -
      (
        chartHeight *
        i /
        gridLines
      );

    context.beginPath();

    context.moveTo(
      paddingLeft,
      y
    );

    context.lineTo(
      width -
      paddingRight,
      y
    );

    context.strokeStyle =
      "#e5e7eb";

    context.lineWidth = 1;

    context.stroke();

    const value =
      maxValue *
      i /
      gridLines;

    context.fillStyle =
      "#6b7280";

    context.fillText(
      formatMoney(value),
      paddingLeft - 8,
      y
    );
  }

  if (!entries.length) {
    context.fillStyle =
      "#6b7280";

    context.textAlign =
      "center";

    context.fillText(
      "Pa gen done retrè pou peryòd sa a.",
      width / 2,
      height / 2
    );

    return;
  }

  const points = [];

  entries.forEach(
    ([date, value], index) => {

      const x =
        paddingLeft +
        (
          entries.length === 1
            ? chartWidth / 2
            : chartWidth *
              index /
              (entries.length - 1)
        );

      const y =
        paddingTop +
        chartHeight -
        (
          Number(value) /
          maxValue *
          chartHeight
        );

      points.push({
        x,
        y,
        date,
        value
      });
    }
  );

  context.beginPath();

  points.forEach(
    (point, index) => {

      if (index === 0) {
        context.moveTo(
          point.x,
          point.y
        );
      } else {
        context.lineTo(
          point.x,
          point.y
        );
      }
    }
  );

  context.strokeStyle =
    "#f97316";

  context.lineWidth = 3;

  context.lineJoin =
    "round";

  context.lineCap =
    "round";

  context.stroke();

  points.forEach(
    point => {

      context.beginPath();

      context.arc(
        point.x,
        point.y,
        3,
        0,
        Math.PI * 2
      );

      context.fillStyle =
        "#f97316";

      context.fill();
    }
  );

  context.textAlign =
    "center";

  context.textBaseline =
    "top";

  const labelStep =
    Math.max(
      1,
      Math.ceil(
        entries.length / 6
      )
    );

  entries.forEach(
    ([date], index) => {

      if (
        index % labelStep !== 0 &&
        index !== entries.length - 1
      ) {
        return;
      }

      const point =
        points[index];

      const formatted =
        date
          .split("-")
          .slice(1)
          .reverse()
          .join("/");

      context.fillStyle =
        "#6b7280";

      context.fillText(
        formatted,
        point.x,
        height - 25
      );
    }
  );
}


async function refreshDashboard() {
  await Promise.all([
    loadSettings(),
    loadProfiles(),
    loadOrders(),
    loadRechargeRequests(),
    loadWithdrawalRequests()
  ]);

  await loadFinancialStats();
  await loadWithdrawalChart();
}


function setupLogin() {
  const form =
    document.getElementById("loginForm");

  const button =
    document.getElementById("loginButton");

  if (!form) {
    console.error(
      "loginForm pa jwenn nan admin.html"
    );
    return;
  }

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        document
          .getElementById("email")
          ?.value
          .trim();

      const password =
        document
          .getElementById("password")
          ?.value;

      if (!email || !password) {
        showLoginMessage(
          "Tanpri ranpli email ak modpas la.",
          true
        );
        return;
      }

      if (!supabaseClient) {
        showLoginMessage(
          "Supabase client la pa disponib.",
          true
        );
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent =
          "Ap konekte...";
      }

      showLoginMessage("");

      try {
        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signInWithPassword({
              email,
              password
            });

        if (error) {
          throw error;
        }

        if (!data?.user) {
          throw new Error(
            "Pa kapab jwenn kont itilizatè a."
          );
        }

        const allowed =
          await isSuperAdmin(
            data.user.id
          );

        if (!allowed) {
          await supabaseClient.auth.signOut();

          throw new Error(
            "Aksè refize. Kont sa a pa Super Admin."
          );
        }

        showLoginMessage(
          "Koneksyon reyisi."
        );

        showAdminPage();

        await refreshDashboard();

      } catch (error) {
        console.error(
          "Login error:",
          error
        );

        showLoginMessage(
          error.message ||
          "Pa kapab konekte.",
          true
        );

      } finally {
        if (button) {
          button.disabled = false;
          button.textContent =
            "Konekte";
        }
      }
    }
  );
}


async function isSuperAdmin(userId) {
  if (!userId) return false;

  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .rpc("is_super_admin");

    if (error) {
      console.error(
        "Super admin verification error:",
        error
      );

      return false;
    }

    return data === true;

  } catch (error) {
    console.error(
      "Super admin error:",
      error
    );

    return false;
  }
    }
function setupQuickActions() {
  const walletButton =
    document.getElementById("walletButton");

  const settingsWalletButton =
    document.getElementById("settingsWalletButton");

  if (walletButton) {
    walletButton.addEventListener(
      "click",
      () => {
        const walletSection =
          document.getElementById("walletSection") ||
          document.getElementById("walletManagement") ||
          document.querySelector(".wallet-section");

        if (walletSection) {
          walletSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });

          return;
        }

        console.warn(
          "Seksyon jesyon wallet la pa jwenn nan admin.html."
        );
      }
    );
  }

  if (settingsWalletButton) {
    settingsWalletButton.addEventListener(
      "click",
      () => {
        const settings =
          document.querySelector(".settings-grid");

        if (settings) {
          settings.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }
      }
    );
  }
}


function setupLogout() {
  const button =
    document.getElementById("logout");

  if (!button) return;

  button.addEventListener(
    "click",
    async () => {

      button.disabled = true;

      try {
        const { error } =
          await supabaseClient.auth.signOut();

        if (error) {
          throw error;
        }

        showLoginPage();

        showLoginMessage(
          "Ou dekonekte avèk siksè."
        );

      } catch (error) {
        console.error(
          "Logout error:",
          error
        );

        alert(
          error.message ||
          "Pa kapab dekonekte."
        );

      } finally {
        button.disabled = false;
      }
    }
  );
}


function setupResize() {
  window.addEventListener(
    "resize",
    () => {

      const adminPage =
        document.getElementById("adminPage");

      if (
        adminPage &&
        adminPage.style.display !== "none"
      ) {
        loadWithdrawalChart();
      }
    }
  );
}


async function initializeAdmin() {
  if (!supabaseClient) {
    console.error(
      "window.supabaseClient pa jwenn."
    );

    showLoginPage();

    showLoginMessage(
      "Sistèm koneksyon an pa disponib.",
      true
    );

    return;
  }

  showLoginPage();

  setupLogin();
  setupRechargeRefresh();
  setupWithdrawalRefresh();
  setupSettings();
  setupPeriod();
  setupQuickActions();
  setupLogout();
  setupResize();

  await checkAdminSession();
}


if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
  );
} else {
  initializeAdmin();
  }
