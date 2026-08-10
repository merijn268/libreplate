import { Button, Container, Navbar } from "react-bootstrap";
import { List } from "react-bootstrap-icons";

interface Props {
  onMenuClick: () => void;
  title: string;
}

export default function TopNavbar({ onMenuClick, title }: Props) {
  return (
    <Navbar bg="body" className="border-bottom sticky-top">
      <Container fluid>
        <div className="d-flex align-items-center">
          <Button
            variant="link"
            className="me-3 p-2 text-body border-0"
            onClick={onMenuClick}
          >
            <List size={24} />
          </Button>
          <Navbar.Brand>{title}</Navbar.Brand>
        </div>
      </Container>
    </Navbar>
  );
}
