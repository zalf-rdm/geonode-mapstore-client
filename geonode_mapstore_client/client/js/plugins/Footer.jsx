import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';

const Footer = () => (
    <div className="ms-footer">


        <footer className="footer font-inter bg-dark text-white py-5" role="contentinfo">
            <div className="container pb-5">
                <div className="row gy-4 text-start text-md-start">
                    {/* Company Info */}
                    <div className="col-6 col-md-6 col-lg-3">
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
                                <a href="/upload" className="link-light text-decoration-none">Upload</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light text-decoration-none">OGC Services and API</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light text-decoration-none">Research Data Management</a>
                            </li>
                        </ul>
                    </nav>

                    {/* Resources */}
                    <nav className="col-6 col-md-6 col-lg-3" aria-label="Resources">
                        <h3 className="fs-5 fw-bold mb-3 text-light">Resources</h3>
                        <ul className="list-unstyled fs-6 fw-normal m-0">
                            <li className="mb-2">
                                <a href="#" className="link-light">Publications</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light">Data Policy</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light">How to Cite Us</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light">Imprint</a>
                            </li>
                            <li className="mb-2">
                                <a href="#" className="link-light ">Privacy</a>
                            </li>
                        </ul>
                    </nav>

                    {/* Social Media */}
                    <div className="col-6 col-md-6 col-lg-3" aria-label="Certified">
                        <h3 className="fs-5 fw-bold mb-3 text-light">Certified By</h3>
                        {/* Icons: centered on mobile, left-aligned on md+ */}
                        <div className="text-start text-md-start mb-2">
                            <img src="/static/img/logo_core_trust_seal_white.png" alt="Core Trust Seal" className="img-fluid mx-auto mx-md-0" style={{ maxHeight: '50px' }} />
                        </div>

                        {/* Logo: centered on mobile, left-aligned on md+ */}
                        <div className="text-start text-md-start mb-2">
                            <h4 className="fw-semibold mb-2 fs-7 text-light">Powered by</h4>
                            <img src="/static/img/logo_zalf_white.png" alt="ZALF" className="img-fluid mx-auto mx-md-0" style={{ maxHeight: '50px' }} />

                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="fs-6 border-top border-gray mt-5 pt-4 text-center text-gray-3">
                ZALF Repository
            </div>
        </footer>

    </div>
);

export default createPlugin('Footer', {
    component: Footer,
    containers: {}
});
