(function () {
	"use strict";

	const header = document.getElementById("header");
	const nav = document.getElementById("nav");
	const burger = document.getElementById("burger");
	const modal = document.getElementById("booking");
	const form = document.getElementById("booking-form");
	const success = document.getElementById("booking-success");
	let lastFocused = null;

	document.getElementById("year").textContent = new Date().getFullYear();

	// Header background on scroll
	function onScroll() {
		header.classList.toggle("is-scrolled", window.scrollY > 10);
	}
	window.addEventListener("scroll", onScroll, { passive: true });
	onScroll();

	// Theme toggle: тёмная по умолчанию, выбор светлой запоминается
	const root = document.documentElement;
	const themeToggle = document.getElementById("theme-toggle");

	function setTheme(light) {
		if (light) root.dataset.theme = "light";
		else delete root.dataset.theme;
		themeToggle.setAttribute("aria-pressed", String(light));
		try {
			localStorage.setItem("theme", light ? "light" : "dark");
		} catch (e) {}
	}

	themeToggle.setAttribute("aria-pressed", String(root.dataset.theme === "light"));
	themeToggle.addEventListener("click", () => setTheme(root.dataset.theme !== "light"));

	// Mobile menu
	function setMenu(open) {
		nav.classList.toggle("is-open", open);
		burger.setAttribute("aria-expanded", String(open));
		burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
	}

	burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
	nav.addEventListener("click", (e) => {
		if (e.target.closest("a")) setMenu(false);
	});
	window.addEventListener("resize", () => {
		if (window.innerWidth > 991) setMenu(false);
	});

	// Active nav link
	const links = document.querySelectorAll(".nav__link");
	const sections = [...links].map((link) => document.querySelector(link.getAttribute("href")));

	const navObserver = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			links.forEach((link) => {
				link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
			});
		});
	}, { rootMargin: "-45% 0px -50% 0px" });
	sections.forEach((section) => section && navObserver.observe(section));

	// Reveal on scroll
	const revealObserver = new IntersectionObserver((entries, observer) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			entry.target.classList.add("is-visible");
			observer.unobserve(entry.target);
		});
	}, { threshold: 0.15 });

	document.querySelectorAll(".reveal").forEach((el, i) => {
		el.style.transitionDelay = (i % 4) * 80 + "ms";
		revealObserver.observe(el);
	});

	// Booking modal
	const dateInput = form.elements.date;
	const today = new Date();
	today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
	dateInput.min = today.toISOString().split("T")[0];

	function openModal(service) {
		lastFocused = document.activeElement;
		form.hidden = false;
		success.hidden = true;
		if (service) form.elements.service.value = service;
		modal.hidden = false;
		document.body.classList.add("is-locked");
		setMenu(false);
		form.elements.name.focus();
	}

	function closeModal() {
		modal.hidden = true;
		document.body.classList.remove("is-locked");
		if (lastFocused) lastFocused.focus();
	}

	document.addEventListener("click", (e) => {
		const opener = e.target.closest("[data-open-booking]");
		if (opener) openModal(opener.dataset.service);
		if (e.target.closest("[data-close-booking]")) closeModal();
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && !modal.hidden) closeModal();
	});

	// Phone mask: +7 (XXX) XXX-XX-XX
	const phoneInput = form.elements.phone;
	phoneInput.addEventListener("input", () => {
		const value = phoneInput.value;
		let digits = value.replace(/\D/g, "");
		// Убираем код страны: префикс маски «+7» или 7/8 во вставленном полном номере
		if (value.startsWith("+7") || (digits.length === 11 && /^[78]/.test(digits))) {
			digits = digits.slice(1);
		}
		digits = digits.slice(0, 10);

		let result = "+7";
		if (digits.length) result += " (" + digits.slice(0, 3);
		if (digits.length > 3) result += ")";
		if (digits.length > 3) result += " " + digits.slice(3, 6);
		if (digits.length > 6) result += "-" + digits.slice(6, 8);
		if (digits.length > 8) result += "-" + digits.slice(8, 10);
		phoneInput.value = digits.length ? result : "";
	});

	// Validation
	const rules = {
		name: (v) => v.trim().length >= 2 || "Укажите имя",
		phone: (v) => v.replace(/\D/g, "").length === 11 || "Введите номер полностью",
		date: (v) => (v && v >= dateInput.min) || "Выберите дату не раньше сегодняшней",
	};

	function validateField(input) {
		const result = rules[input.name](input.value);
		const field = input.closest(".form__field");
		const message = result === true ? "" : result;
		field.classList.toggle("has-error", Boolean(message));
		field.querySelector(".form__error").textContent = message;
		return !message;
	}

	Object.keys(rules).forEach((name) => {
		form.elements[name].addEventListener("blur", (e) => validateField(e.target));
	});

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		const fields = Object.keys(rules).map((name) => form.elements[name]);
		const valid = fields.map(validateField).every(Boolean);
		if (!valid) {
			fields.find((f) => f.closest(".has-error")).focus();
			return;
		}
		// Здесь можно отправить данные на сервер: new FormData(form)
		form.reset();
		form.hidden = true;
		success.hidden = false;
		success.querySelector("button").focus();
	});
})();
