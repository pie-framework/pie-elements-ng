// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/drawing-response/drawable-transformer.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Transformer } from 'react-konva';

class TransformerComponent extends React.Component {
  componentDidMount() {
    this.checkNode();
  }

  componentDidUpdate() {
    this.checkNode();
  }

  checkNode() {
    // here we need to manually attach or detach Transformer node
    const stage = this.transformer.getStage();
    const { selectedShapeName } = this.props;

    const selectedNode = stage.findOne(`.${selectedShapeName}`);
    // do nothing if selected node is already attached
    if (selectedNode === this.transformer.node()) {
      return;
    }

    if (selectedNode) {
      // attach to another node
      this.transformer.attachTo(selectedNode);
    } else {
      // remove transformer
      this.transformer.detach();
    }
    this.transformer.getLayer().batchDraw();
  }

  render() {
    return (
      <Transformer
        ref={(node) => {
          this.transformer = node;
        }}
        enabledAnchors={['middle-left', 'middle-right']}
        {...this.props}
      />
    );
  }
}

TransformerComponent.propTypes = {
  selectedShapeName: PropTypes.string.isRequired,
};

export default TransformerComponent;
