import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';

const Footer = () => (
    <div className="ui-zalf ms-footer">


        <footer className="footer font-inter bg-dark text-white py-5" role="contentinfo">
            <div className="container pb-5">
                <div className="row gy-4 text-center text-md-start">
                    {/* Company Info */}
                    <div className="col-12 col-md-6 col-lg-3">
                        <h3 className="fs-5 fw-bold mb-3 text-light">ZALF Repository</h3>
                        <p className="mb-0 fs-7 text-gray-3">
                            Discover, visualize, and share high-quality datasets powering open science, policy, and innovation.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <nav className="col-6 col-md-6 col-lg-3" aria-label="Quick Links">
                        <h3 className="fs-5 fw-bold mb-3 text-light">Quick Links</h3>
                        <ul className="list-unstyled fs-6 fw-normal m-0">
                            <li className="mb-2">
                                <a href="#explore" className="link-light text-decoration-none">About</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light text-decoration-none">Publishing</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light text-decoration-none">API Documentation</a>
                            </li>
                            <li>
                                <a href="#" className="link-light text-decoration-none">Data Management</a>
                            </li>
                        </ul>
                    </nav>

                    {/* Resources */}
                    <nav className="col-6 col-md-6 col-lg-3" aria-label="Resources">
                        <h3 className="fs-5 fw-bold mb-3 text-light">Resources</h3>
                        <ul className="list-unstyled fs-6 fw-normal m-0">
                            <li className="mb-2">
                                <a href="#" className="link-light text-decoration-none">Publications</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light text-decoration-none">Data Policy</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light text-decoration-none">Contact Us</a>
                            </li>
                            <li>
                                <a href="#" className="link-light text-decoration-none">FAQ</a>
                            </li>
                        </ul>
                    </nav>

                    {/* Social Media */}
                    <div className="col-12 col-md-6 col-lg-3">
                        <h3 className="fs-5 fw-bold mb-3 text-light">Follow Us</h3>

                        {/* Icons: centered on mobile, left-aligned on md+ */}
                        <div className="d-flex justify-content-center justify-content-md-start gap-3 mb-4">
                            <a href="https://www.linkedin.com/company/zalf-leibniz" class="fs-5 text-light" title="LinkedIn" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>
                            <a href="https://www.youtube.com/@ZALF_Leibniz" class="fs-5 text-light" title="Youtube" aria-label="'Youtube"><i class="bi bi-youtube"></i></a>
                            <a href="https://www.instagram.com/querfeldein.blog/" class="fs-5 text-light" title="Instagram" aria-label="Instagram"><i class="bi bi-instagram"></i></a>
                            <a href="https://bsky.app/profile/zalf.bsky.social" class="fs-5 text-light" title="Bluesky" aria-label="Bluesky"><i class="bi bi-bluesky"></i></a>
                            <a href="https://github.com/zalf-rdm" class="fs-5 text-light" title="GitHub" aria-label="GitHub"><i class="bi bi-github"></i></a>
                        </div>

                        {/* Logo: centered on mobile, left-aligned on md+ */}
                        <div className="text-center text-md-start">
                            <h4 className="fw-semibold mb-2 fs-7 text-light">Powered by</h4>
                            <img src="/static/ui_zalf/img/logos/logo_zalf_white.png" alt="ZALF" className="img-fluid mx-auto mx-md-0" style={{ maxHeight: '50px' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="fs-6 border-top border-gray mt-5 pt-4 text-center text-gray-3">
                &copy; {new Date().getFullYear()} ZALF Repository. All rights reserved.
            </div>
        </footer>

    </div>
);

export default createPlugin('Footer', {
    component: Footer,
    containers: {}
});
