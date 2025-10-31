import { TypoXLarge, TypoBase } from "@/shared/ui";

const TermsOfService = () => {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Content */}
      <div className="bg-background-surface-2 md:bg-background-surface-1 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[587px] px-4 py-4 md:py-20">
          {/* Desktop title - hidden on mobile */}
          <TypoXLarge className="text-text-primary mb-8 hidden font-semibold md:block">
            Terms of Use
          </TypoXLarge>

          {/* Last updated */}
          <TypoBase className="text-text-placeholder mb-6">
            Last updated: May 19th, 2025
          </TypoBase>

          {/* Terms content */}
          <div className="text-text-primary prose prose-invert max-w-none text-base">
            <div className="mb-8"></div>

            <p className="text-text-placeholder mb-6">
              Hello and welcome! These Terms of Use are an agreement formed
              between you and harpy chat Inc. In these Terms we’ll sometimes
              refer to harpy chat Inc. as “Company,” “we,” or “us.” We’ll refer
              to astrsk.ai, together with any content, tools, features and
              functionality offered on or through them, as the “Services.”
            </p>

            <p className="text-text-placeholder mb-6">
              These Terms govern your access to and use of the Services. Please
              read them carefully, as they include important information about
              your legal rights. By accessing or using the Services, you’re
              agreeing to these Terms. If you don’t understand or agree to these
              Terms, please don’t use the Services.
            </p>

            <p className="text-text-placeholder mb-6">
              In these Terms, “you” and “your” means you as the user of the
              Services. If you use the Services on behalf of a company or other
              entity then “you” includes you and that entity, and you represent
              and warrant that (a) you are an authorized representative of the
              entity with the authority to bind the entity to these Terms, and
              (b) you agree to these Terms on the entity’s behalf.
            </p>

            <p className="text-text-placeholder mb-6 font-semibold">
              NOTE: THESE TERMS CONTAIN AN ARBITRATION CLAUSE AND CLASS ACTION
              WAIVER. By agreeing to these Terms, you agree to resolve all
              disputes with us through binding individual arbitration. That
              means you also waive any right to have those disputes decided by a
              judge or jury, and you waive your right to participate in class
              actions, class arbitrations, or representative actions. You have
              the right to opt out of arbitration as explained below.
            </p>

            <div className="mb-8">
              <hr className="border-border-divider my-6" />
            </div>

            <h3 className="mt-8 mb-4 font-semibold">Use of the Services</h3>

            <p className="mb-6">
              Your Registration Obligations. When you register to use the
              Services, you agree to provide accurate and complete information
              about yourself. If you are under 13 years old OR if you are an EU
              citizen or resident under 16 years old, do not sign up for the
              Services – you are not authorized to use them.
            </p>
            <p className="mb-6">
              You acknowledge and agree that any questions, comments,
              suggestions, ideas, feedback or other information about the
              Services provided by you to astrsk.ai are non-confidential, and
              that we are entitled to use and disseminate them for any purpose,
              without acknowledgment of or compensation to you.
            </p>

            <p className="mb-6">
              You acknowledge and agree that we may preserve metadata in
              compliance with our Privacy Policy. You acknowledge and agree that
              we may disclose data if required to do so by law or in the good
              faith belief that such preservation or disclosure is reasonably
              necessary to: (a) comply with legal process, applicable laws or
              government requests; (b) enforce these Terms; (c) protect the
              rights, property, or personal safety of astrsk.ai, its users and
              the public.
            </p>

            <h3 className="mt-8 mb-4 font-semibold">Indemnity and Release</h3>
            <p className="mb-6">
              You agree to release, indemnify and hold harpy chat Inc. and its
              affiliates and their officers, employees, directors and agents
              harmless from any and all losses, damages, and expenses of any
              kind arising out of or relating to your use of the Services.
              Without limiting the foregoing, the release and indemnification
              described above includes reasonable attorneys’ fees, rights,
              claims, actions of any kind and injury (including death) arising
              out of or relating to your use of the Services.
            </p>

            <h3 className="mt-8 mb-4 font-semibold">Disclaimer of Warranty</h3>
            <p className="mb-6">
              Your use of the Services is at your sole risk. The site is
              provided on an “AS IS” and “AS AVAILABLE” basis. harpy chat Inc.
              expressly disclaims all warranties of any kind, whether express,
              implied or statutory, including, but not limited to the implied
              warranties of merchantability, fitness for a particular purpose,
              title and non-infringement. harpy chat Inc. makes no warranty that
              (i) the Services will meet your requirements, (ii) the results
              that may be obtained from the use of the Services will be accurate
              or reliable.
            </p>

            <h3 className="mt-8 mb-4 font-semibold">Limitation of Liability</h3>
            <p className="mb-6">
              You understand and agree that harpy chat Inc. will not be liable
              for any indirect, incidental, special, consequential, or exemplary
              damages, or damages for loss of profits including but not limited
              to damages for loss of goodwill, use, data or other intangible
              losses, whether based on contract, tort, negligence, strict
              liability or otherwise, resulting from: (i) the use or the
              inability to use the Services; (ii) your access, use, creation of,
              or interaction with any Content, Character or Generations; (iii)
              your sharing with any third party of any Content, Character or
              Generations; or (vi) any other matter relating to the Services.
            </p>

            <h3 className="mt-8 mb-4 font-semibold">
              Dispute Resolution By Binding Arbitration
            </h3>

            <p className="mb-6">
              Agreement to Arbitrate. This Dispute Resolution by Binding
              Arbitration section of the Terms is referred to in these Terms as
              the “Arbitration Agreement.” You agree that any and all disputes
              or claims that have arisen or may arise between you and harpy chat
              Inc., whether arising out of or relating to these Terms (including
              any alleged breach thereof), the Website or Services, any aspect
              of the relationship or transactions between us, shall be resolved
              exclusively through final and binding arbitration, rather than a
              court, in accordance with the terms of this Arbitration Agreement,
              except that you may assert individual claims in small claims
              court, if your claims qualify. Further, this Arbitration Agreement
              does not preclude you from bringing issues to the attention of
              federal, state, or local agencies, and such agencies can, if the
              law allows, seek relief against us on your behalf. You agree that,
              by entering into these Terms, you and harpy chat Inc. are each
              waiving the right to a trial by jury or to participate in a class
              action. Your rights will be determined by a neutral arbitrator,
              not a judge or jury. The Federal Arbitration Act governs the
              interpretation and enforcement of this Arbitration Agreement.
            </p>

            <p className="mb-6">
              Prohibition of Class and Representative Actions and
              Non-Individualized Relief. You and harpy chat Inc. agree that each
              of us may bring claims against the other only on an individual
              basis and not as a plaintiff or class member in any purported
              class or representative action or proceeding. Unless both you and
              harpy chat Inc. agree otherwise, the arbitrator may not
              consolidate or join more than one person’s or party’s claims and
              may not otherwise preside over any form of a consolidated,
              representative, or class proceeding. Also, the arbitrator may
              award relief (including monetary, injunctive, and declaratory
              relief) only in favor of the individual party seeking relief and
              only to the extent necessary to provide relief necessitated by
              that party’s individual claims.
            </p>

            <p className="mb-6">
              Confidentiality. All aspects of the arbitration proceeding, and
              any ruling, decision, or award by the arbitrator, will be strictly
              confidential for the benefit of all parties.{" "}
            </p>

            <h3 className="mt-8 mb-4 font-semibold">General</h3>

            <p className="mb-2">
              <span className="font-medium">Entire Agreement.</span> These Terms
              constitute the entire agreement between you and harpy chat Inc.
              and govern your use of our Services, superseding any prior
              agreements between you and harpy chat Inc. with respect to the
              Services.
            </p>

            <p className="mb-2">
              <span className="font-medium">No Waiver.</span> Any failure of
              harpy chat Inc. to exercise or enforce any right or provision of
              these Terms does not constitute a waiver of such right or
              provision.
            </p>

            <p className="mb-2">
              <span className="font-medium">Expiration of Claims.</span> You
              agree that regardless of any statute or law to the contrary, any
              claim or cause of action arising out of or related to use of the
              Website or these Terms must be filed within one year after such
              claim or cause of action arose or be forever barred.
            </p>

            <p className="mb-6">
              <span className="font-medium">Notice.</span> Notices to you may be
              made via either email or regular mail. The Site may also provide
              notices to you of changes to these Terms or other matters by
              displaying notices or links to notices generally on the Services.
            </p>

            <h3 className="mt-8 mb-4 font-semibold">Changes to these Terms</h3>

            <p className="mb-6">
              We reserve the right, at our sole discretion, to change or modify
              portions of these Terms at any time. If we do this, we will post
              the changes on this page and will indicate at the top of this page
              the date these terms were last revised. Any such changes will
              become effective no earlier than 14 days after they are posted,
              except that changes addressing new functions of the Services or
              changes made for legal reasons will be effective immediately. Your
              continued use of the Services after the date any such changes
              become effective constitutes your acceptance of the new Terms.
            </p>

            <h3 className="mt-8 mb-4 font-semibold">Contact Us</h3>

            <p className="mb-6">
              If you have any questions about our Services, or to report any
              violations of these Terms, please contact us through the{" "}
              <a
                href="https://discord.gg/wAKM6CEF"
                className="text-primary-strong hover:text-primary-strong/80"
              >
                official astrsk.ai discord server.
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
