// SPDX-License-Identifier: GPL-2.0-only
const adminMotion = `
@media (prefers-reduced-motion: no-preference) {
	@keyframes edt-enter {
		from { opacity: .6; transform: translateY(9px); }
		to { opacity: 1; transform: none; }
	}
	@keyframes edt-accent-in {
		from { opacity: .45; scale: .97; rotate: 4deg; }
		to { opacity: 1; scale: 1; rotate: 0deg; }
	}
	@keyframes edt-fade-out {
		to { opacity: 0; }
	}
	@keyframes edt-status-in {
		from { opacity: .55; }
		to { opacity: 1; }
	}

	.main > .heading,
	.main > .hero,
	.main > .panel,
	.main section.panel,
	.main .card,
	.login > .panel .brand {
		animation: edt-enter .32s cubic-bezier(.22, .7, .25, 1) backwards;
	}
	.main .card:nth-child(2),
	.main > .panel:nth-of-type(2) { animation-delay: 35ms; }
	.main .card:nth-child(3),
	.main > .panel:nth-of-type(3) { animation-delay: 70ms; }
	.main > .panel:focus-within,
	.main section.panel:focus-within { animation: none; }

	.hero::after { animation: edt-accent-in .66s cubic-bezier(.22, .7, .25, 1) both; }
	.main tbody tr:nth-child(-n+5) {
		animation: edt-enter .22s cubic-bezier(.22, .7, .25, 1) backwards;
	}
	.main tbody tr:nth-child(2) { animation-delay: 20ms; }
	.main tbody tr:nth-child(3) { animation-delay: 40ms; }
	.main tbody tr:nth-child(4) { animation-delay: 60ms; }
	.main tbody tr:nth-child(5) { animation-delay: 80ms; }
	.main tbody tr:focus-within,
	.main .panel:has(input[type="search"]:focus) tbody tr { animation: none; }
	.status-area:not(:empty), [role="alert"]:not([hidden]):not(:empty) {
		animation: edt-status-in .2s ease-out;
	}

	button, .button, .sidebar nav a {
		transition: background-color .16s ease, box-shadow .16s ease, scale .14s ease-out;
	}
	button:active:not(:disabled), .button:active, .sidebar nav a:active { scale: .97; }

	@media (hover: hover) and (pointer: fine) {
		.sidebar .nav-icon, .brand .logo, .hero::after {
			transition: translate .23s ease-out;
		}
		.sidebar nav a:hover .nav-icon { translate: 2px 0; }
		.brand:hover .logo { translate: 0 -2px; }
		.hero:hover::after { translate: -5px 0; }
	}

	@supports (transition-behavior: allow-discrete) and (overlay: auto) {
		dialog {
			opacity: 0;
			transform: translateY(8px) scale(.985);
			transition: opacity .18s ease, transform .23s cubic-bezier(.22, .7, .25, 1),
				display .23s allow-discrete, overlay .23s allow-discrete;
		}
		dialog[open] { animation: none; opacity: 1; transform: none; }
		dialog::backdrop {
			opacity: 0;
			transition: opacity .2s ease, display .23s allow-discrete, overlay .23s allow-discrete;
		}
		dialog[open]::backdrop { opacity: 1; }

		@starting-style {
			dialog[open] { opacity: 0; transform: translateY(8px) scale(.985); }
			dialog[open]::backdrop { opacity: 0; }
		}
	}

	@supports (interpolate-size: allow-keywords) and selector(details::details-content) {
		.main details::details-content {
			interpolate-size: allow-keywords;
			block-size: 0;
			overflow: clip;
			opacity: 0;
			transition: block-size .23s cubic-bezier(.22, .7, .25, 1), opacity .18s ease,
				content-visibility .23s allow-discrete;
		}
		.main details[open]::details-content { block-size: auto; opacity: 1; }
	}

	@view-transition { navigation: auto; }
	.sidebar { view-transition-name: edt-sidebar; }
	.main { view-transition-name: edt-main; }

	::view-transition { pointer-events: none; }
	::view-transition-old(edt-sidebar) { animation: none; opacity: 0; }
	::view-transition-new(edt-sidebar) { animation: none; }
	::view-transition-group(edt-sidebar), ::view-transition-group(edt-main) { animation-duration: .22s; }
	::view-transition-old(root), ::view-transition-old(edt-main) {
		animation: edt-fade-out .13s ease-out both;
	}
	::view-transition-new(root), ::view-transition-new(edt-main) {
		animation: edt-status-in .22s ease-out both;
	}
}
`;

export function addAdminMotion(response) {
	if (!response.headers.get('Content-Type')?.startsWith('text/html')) return response;
	const policy = response.headers.get('Content-Security-Policy') || '';
	const nonce = /(?:^|;)\s*style-src\s+[^;]*?'nonce-([a-z0-9+/_-]+={0,2})'/i.exec(policy)?.[1];
	if (!nonce) return response;

	// Reuse the page's style nonce and leave the existing security policy intact.
	return new HTMLRewriter()
		.on('head', {
			element(head) {
				head.append(`<style id="edt-admin-motion" nonce="${nonce}">${adminMotion}</style>`, { html: true });
			},
		})
		.transform(response);
}
