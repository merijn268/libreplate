import { useState } from "react";
import { Form, Row, Col } from "react-bootstrap";

import { recipesPartialUpdate } from "@/api/generated";
import type { Recipe } from "@/api/generated/types.gen";

import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";

type Props = {
  recipe: Recipe;
};

export default function RecipeDetailsForm({ recipe }: Props) {
  const [name, setName] = useState(recipe.name ?? "");
  const [description, setDescription] = useState(recipe.description ?? "");
  const [instructions, setInstructions] = useState(recipe.instructions ?? "");
  const [portions, setPortions] = useState(String(recipe.portions ?? 0));
  const [cookingTime, setCookingTime] = useState(recipe.cooking_time ?? "");
  const [preppingTime, setPreppingTime] = useState(recipe.prepping_time ?? "");

  const descriptionRef = useAutoResizeTextarea(description);
  const instructionsRef = useAutoResizeTextarea(instructions);

  const save = (field: keyof Recipe, value: string) => {
    recipesPartialUpdate({
      path: {
        id: recipe.id,
      },
      body: {
        [field]: field === "portions" ? Number(value) : value,
      },
    });
  };

  return (
    <div className="card mb-2">
      <div className="card-body">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>

            <Form.Control
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => save("name", name)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>

            <Form.Control
              ref={descriptionRef}
              as="textarea"
              rows={1}
              style={{
                overflow: "hidden",
                resize: "none",
              }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => save("description", description)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Instructions</Form.Label>

            <Form.Control
              ref={instructionsRef}
              as="textarea"
              rows={1}
              style={{
                overflow: "hidden",
                resize: "none",
              }}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              onBlur={() => save("instructions", instructions)}
            />
          </Form.Group>

          <Row>
            <Col>
              <Form.Group className="mb-1">
                <Form.Label>Portions</Form.Label>

                <Form.Control
                  type="number"
                  min={1}
                  value={portions}
                  onChange={(e) => setPortions(e.target.value)}
                  onBlur={() => save("portions", portions)}
                />
              </Form.Group>
            </Col>

            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Cook time (min)</Form.Label>

                <Form.Control
                  value={cookingTime}
                  onChange={(e) => setCookingTime(e.target.value)}
                  onBlur={() => save("cooking_time", cookingTime)}
                />
              </Form.Group>
            </Col>

            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Prep time (min)</Form.Label>

                <Form.Control
                  value={preppingTime}
                  onChange={(e) => setPreppingTime(e.target.value)}
                  onBlur={() => save("prepping_time", preppingTime)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}
