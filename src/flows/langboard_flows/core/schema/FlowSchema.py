from langflow.schema.schema import InputType
from lfx.graph.schema import RunOutputs
from pydantic import BaseModel, ConfigDict, Field, model_serializer


class RunResponse(BaseModel):
    """Run response schema."""

    outputs: list[RunOutputs] | None = []
    session_id: str | None = None

    @model_serializer(mode="plain")
    def serialize(self):
        # Serialize all the outputs if they are base models
        serialized = {"session_id": self.session_id, "outputs": []}
        if self.outputs:
            serialized_outputs = []
            for output in self.outputs:
                if isinstance(output, BaseModel) and not isinstance(output, RunOutputs):
                    serialized_outputs.append(output.model_dump(exclude_none=True))
                else:
                    serialized_outputs.append(output)
            serialized["outputs"] = serialized_outputs
        return serialized


class InputValueRequest(BaseModel):
    components: list[str] | None = []
    input_value: str | None = None
    session: str | None = None
    type: InputType | None = Field(
        "any",
        description="Defines on which components the input value should be applied. "
        "'any' applies to all input components.",
    )

    # add an example
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "components": ["components_id", "Component Name"],
                    "input_value": "input_value",
                    "session": "session_id",
                },
                {"components": ["Component Name"], "input_value": "input_value"},
                {"input_value": "input_value"},
                {
                    "components": ["Component Name"],
                    "input_value": "input_value",
                    "session": "session_id",
                },
                {"input_value": "input_value", "session": "session_id"},
                {"type": "chat", "input_value": "input_value"},
                {"type": "json", "input_value": '{"key": "value"}'},
            ]
        },
        extra="forbid",
    )
