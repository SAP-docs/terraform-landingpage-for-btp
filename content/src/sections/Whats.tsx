
import React from 'react'
import Link from '@docusaurus/Link';
import '@ui5/webcomponents-icons/dist/AllIcons';
import { Button } from '@ui5/webcomponents-react';


export default function OverviewSection(): JSX.Element {
  return (
    <section >
      <br />

      <div className="container">
        <div className='whats_banner'>

          <div className="whats_body">
            <p className="whats_body_p">You find an overview of all important updates about Terraform providers and tools
              <Link to="/docs/landing-page-content/latest/">
                <Button design="Emphasized" style={{ width: 100, marginLeft: 12 }}>
                  here
                </Button>
              </Link>
            </p>
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
