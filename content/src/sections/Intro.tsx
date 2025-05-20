
import React from 'react'
import Link from '@docusaurus/Link';
import { Button } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/AllIcons';


export default function GuideSection(): JSX.Element {
  return (
    <section >
      <div className="container">
        <div className="intro">
          <div className='intro_image'>
            <img src="img/registries.png" />
          </div>
          <div className="intro_body">
            <h2 >
              <b >Introduction</b><br />
            </h2>
            <p>
              This page serves as a central landing page for all things Terraform and OpenTofu on SAP BTP.<br />
              This helps you to get all relevant links and information about Terraform and OpenTofu on SAP BTP.<br /><br />
              We will continuously update the page to add new links that help you in your journey with Terraform/OpenTofu on SAP BTP.<br /><br />
              We welcome your feedback to enhance the guidelines even further.<br />
            </p>

            <Link to="/docs/landing-page-content/where_to_start/">
              <Button design="Emphasized" style={{ width: 150 }}>
                Landing page
              </Button>
            </Link>

          </div>


        </div>
      </div>
    </section>



  )
}

export function HighlightText(props) {
  return (
    <strong className="bolder relative z-10 box-content before:absolute before:bottom-0 before:z-[-1] before:h-3 before:w-full before:bg-[#95DAFF50] before:duration-300 before:content-[''] hover:before:w-0">
      {props.children}
    </strong>
  )
}
