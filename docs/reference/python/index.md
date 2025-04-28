## Quick Start

This section provides an overview of the waldiez library and its core functionality.
You can find detailed documentation for each class and method in the 
next sections.

### Exporting a Waldiez Flow

```python
# Export a Waldiez flow to a python script or a jupyter notebook
from waldiez import WaldiezExporter
flow_path = "/path/to/a/flow.waldiez"
output_path = "/path/to/an/output.py"  # or .ipynb
exporter = WaldiezExporter.load(flow_path)
exporter.export(output_path)
```

### Running a Waldiez Flow

```python
# Run a flow
from waldiez import WaldiezRunner
flow_path = "/path/to/a/flow.waldiez"
output_path = "/path/to/an/output.py"
runner = WaldiezRunner.load(flow_path)
runner.run(output_path=output_path)
```
