import { Nav, Offcanvas } from "react-bootstrap";
import { NavLink } from "react-router-dom";

import { bottomNavigation, mainNavigation } from "./navigation";

interface Props {
  show: boolean;
  onHide: () => void;
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-link px-3 py-2 rounded-2 ${
    isActive ? "text-white bg-primary" : "text-body"
  }`;

export default function Sidebar({ show, onHide }: Props) {
  const renderLinks = (items: typeof mainNavigation) =>
    items.map(({ path, label, icon: Icon }) => (
      <NavLink
        key={path}
        to={path}
        end={path === "/"}
        onClick={onHide}
        className={linkClass}
      >
        <Icon className="me-2" />
        {label}
      </NavLink>
    ));

  return (
    <Offcanvas show={show} onHide={onHide} placement="start">
      <Offcanvas.Header closeButton>
        <span
          className="me-2"
          style={{
            width: 50,
            height: 50,
            display: "inline-block",
            background: "var(--bs-primary)",
            mask: "url('/logo.png') center / contain no-repeat",
            WebkitMask: "url('/logo.png') center / contain no-repeat",
          }}
          role="img"
          aria-label="LibrePlate"
        />
        <Offcanvas.Title>LibrePlate</Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column">
        <Nav className="flex-column gap-1 flex-grow-1">
          {renderLinks(mainNavigation)}
        </Nav>

        <Nav className="flex-column gap-1 border-top pt-3">
          {renderLinks(bottomNavigation)}
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
