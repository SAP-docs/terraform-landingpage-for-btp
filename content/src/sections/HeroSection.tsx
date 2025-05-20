
import React from 'react'
import '@ui5/webcomponents-icons/dist/AllIcons';


export default function HeroSection(): JSX.Element {
  return (
    <section >
      <br />
      <div className='hero_banner'>
        <div className="container">

          <div className="welcome">
            <h1>
              <b className="header_text" >
                Terraform on SAP BTP
              </b>
            </h1>
            <div className="header_body">
              <p className="header_body_p">Welcome to the landing page for Terraform/OpenTofu on SAP BTP.<br /><br />
                This page provides you all the necessary information to get your journey started.
              </p>
            </div>
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
