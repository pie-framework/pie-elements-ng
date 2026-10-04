// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { Layer as LayerImport, Stage as StageImport } from 'react-konva';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
const Stage = unwrapReactInteropSymbol(StageImport, 'Stage');
const Layer = unwrapReactInteropSymbol(LayerImport, 'Layer');
import { styled } from '@mui/material/styles';
import { uniqueId } from '@pie-element/shared-lodash';
import Translator from '@pie-lib/translator';

import Rectangle from './rectangle.js';
import Polygon from './polygon.js';
import Circle from './circle.js';

const { translator } = Translator;

const BaseContainer: any = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  position: 'relative',
  background: theme.palette.common.white,
  border: `${theme.spacing(1)} solid ${theme.palette.common.white}`,
  width: 'fit-content',
  maxWidth: '100%',
  overflowX: 'auto',
}));

const HiddenFocusable: any = styled('span')({
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
});

const ImageContainer: any = styled('div')({
  position: 'relative',
  width: 'fit-content',
});

const Image: any = styled('img')({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
});

const StyledStage: any = styled(Stage)({
  left: 0,
  top: 0,
  position: 'absolute',
});

export class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focusedShapeId: null,
    };
  }

  isSelected(shape) {
    const selectedShape = this.props.session.answers.filter((answer) => answer.id === shape.id)[0];
    return !!selectedShape;
  }

  correctness = (isCorrect, isChecked) => (isCorrect ? isChecked : !isChecked);

  descriptionId: string = uniqueId('hotspot-evaluation-');

  // The canvas tooltip and the shape button's description both carry this text.
  getEvaluateText: any = (isCorrect, selected) => {
    const { language } = this.props;

    if (selected && isCorrect) {
      return translator.t('hotspot.correctlySelected', { lng: language });
    }

    if (selected && !isCorrect) {
      return translator.t('hotspot.shouldNotHaveBeenSelected', { lng: language });
    }

    if (!selected && isCorrect) {
      return translator.t('hotspot.shouldHaveBeenSelected', { lng: language });
    }

    return null;
  };

  getAllShapesSorted: any = () => {
    const { shapes: { rectangles = [], polygons = [], circles = [] } } = this.props;
    const allShapes = [
      ...rectangles.map((s) => ({ ...s, type: 'rectangle' })),
      ...polygons.map((s) => ({ ...s, type: 'polygon' })),
      ...circles.map((s) => ({ ...s, type: 'circle' })),
    ];
    allShapes.sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));

    return allShapes;
  };

  // The canvas redraws the shapes that the focusables below expose, so assistive technology skips it.
  hideCanvas: any = (layer) => {
    layer?.getNativeCanvasElement().setAttribute('aria-hidden', 'true');
  };

  handleShapeFocus: any = (shapeId) => {
    this.setState({ focusedShapeId: shapeId });
  };

  handleShapeBlur: any = () => {
    this.setState({ focusedShapeId: null });
  };

  handleShapeKeyDown: any = (e, shapeId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();

      const { onSelectChoice, disabled } = this.props;

      if (!disabled) {
        const shape = this.getAllShapesSorted().find((s) => s.id === shapeId);

        if (shape) {
          const selected = this.isSelected(shape);

          onSelectChoice({ id: shapeId, selected: !selected, selector: 'Keyboard' });
        }
      }
    }
  };

  render() {
    const {
      dimensions: { width: withProp, height: heightProp },
      disabled,
      hotspotColor,
      hoverOutlineColor,
      selectedHotspotColor,
      imageUrl,
      isEvaluateMode,
      language,
      outlineColor,
      onSelectChoice,
      shapes: { rectangles = [], polygons = [], circles = [] },
      scale: SCALE,
      strokeWidth,
      showCorrect,
    } = this.props;

    const { focusedShapeId } = this.state;

    const width = withProp * SCALE;
    const height = heightProp * SCALE;

    const sortedShapes = this.getAllShapesSorted();

    return (
      <BaseContainer style={{ padding: strokeWidth / 2 }}>
        {imageUrl ? (
          <ImageContainer>
            <Image
              alt={translator.t('hotspot.image', { lng: language, count: sortedShapes.length })}
              height="auto"
              src={imageUrl}
              style={{ width, height, maxWidth: width, maxHeight: height }}
            />
          </ImageContainer>
        ) : null}

        <StyledStage
          height={height + strokeWidth}
          width={width + strokeWidth}
          x={strokeWidth / 2}
          y={strokeWidth / 2}
        >
          <Layer ref={this.hideCanvas}>
            {rectangles.map((shape) => {
              const selected = this.isSelected(shape);
              const isCorrect = isEvaluateMode ? this.correctness(shape.correct, selected) : undefined;
              const evaluateText = isEvaluateMode ? this.getEvaluateText(shape.correct, selected) : null;
              const markAsCorrect = !!(isEvaluateMode && showCorrect && shape.correct);

              return (
                <Rectangle
                  scale={SCALE}
                  isEvaluateMode={isEvaluateMode}
                  isCorrect={isCorrect}
                  evaluateText={evaluateText}
                  disabled={disabled}
                  selected={selected}
                  height={shape.height}
                  hotspotColor={hotspotColor}
                  hoverOutlineColor={hoverOutlineColor}
                  selectedHotspotColor={selectedHotspotColor}
                  id={shape.id}
                  key={shape.id}
                  onClick={onSelectChoice}
                  outlineColor={outlineColor}
                  width={shape.width}
                  x={shape.x}
                  y={shape.y}
                  strokeWidth={strokeWidth}
                  markAsCorrect={markAsCorrect}
                  showCorrectEnabled={showCorrect}
                  focused={focusedShapeId === shape.id}
                />
              );
            })}
            {polygons.map((polygon) => {
              const selected = this.isSelected(polygon);
              const isCorrect = isEvaluateMode ? this.correctness(polygon.correct, selected) : undefined;
              const evaluateText = isEvaluateMode ? this.getEvaluateText(polygon.correct, selected) : null;
              const markAsCorrect = !!(isEvaluateMode && showCorrect && polygon.correct);

              return (
                <Polygon
                  scale={SCALE}
                  isEvaluateMode={isEvaluateMode}
                  isCorrect={!!isCorrect}
                  evaluateText={evaluateText}
                  disabled={disabled}
                  selected={selected}
                  hotspotColor={hotspotColor}
                  id={polygon.id}
                  key={polygon.id}
                  onClick={onSelectChoice}
                  outlineColor={outlineColor}
                  points={polygon.points}
                  strokeWidth={strokeWidth}
                  markAsCorrect={markAsCorrect}
                  selectedHotspotColor={selectedHotspotColor}
                  hoverOutlineColor={hoverOutlineColor}
                  showCorrectEnabled={showCorrect}
                  focused={focusedShapeId === polygon.id}
                />
              );
            })}
            {circles.map((shape) => {
              const selected = this.isSelected(shape);
              const isCorrect = isEvaluateMode ? this.correctness(shape.correct, selected) : undefined;
              const evaluateText = isEvaluateMode ? this.getEvaluateText(shape.correct, selected) : null;
              const markAsCorrect = !!(isEvaluateMode && showCorrect && shape.correct);

              return (
                <Circle
                  scale={SCALE}
                  isEvaluateMode={isEvaluateMode}
                  isCorrect={isCorrect}
                  evaluateText={evaluateText}
                  disabled={disabled}
                  selected={selected}
                  radius={shape.radius}
                  hotspotColor={hotspotColor}
                  id={shape.id}
                  key={shape.id}
                  onClick={onSelectChoice}
                  outlineColor={outlineColor}
                  x={shape.x}
                  y={shape.y}
                  strokeWidth={strokeWidth}
                  markAsCorrect={markAsCorrect}
                  selectedHotspotColor={selectedHotspotColor}
                  hoverOutlineColor={hoverOutlineColor}
                  showCorrectEnabled={showCorrect}
                  focused={focusedShapeId === shape.id}
                />
              );
            })}
          </Layer>
        </StyledStage>

        {sortedShapes.map((shape, index) => {
          const selected = this.isSelected(shape);
          const name =
            shape.ariaLabel?.trim() ||
            translator.t('hotspot.shape', { lng: language, index: index + 1, total: sortedShapes.length });
          const evaluateText = isEvaluateMode ? this.getEvaluateText(shape.correct, selected) : null;
          const descriptionId = `${this.descriptionId}-${index}`;

          return (
            <React.Fragment key={`focus-${shape.id}`}>
              <HiddenFocusable
                tabIndex={disabled ? -1 : 0}
                role="button"
                aria-label={name}
                aria-pressed={selected}
                aria-describedby={evaluateText ? descriptionId : undefined}
                onFocus={() => this.handleShapeFocus(shape.id)}
                onBlur={this.handleShapeBlur}
                onKeyDown={(e) => this.handleShapeKeyDown(e, shape.id)}
              />
              {evaluateText && (
                <span id={descriptionId} hidden>
                  {evaluateText}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </BaseContainer>
    );
  }
}

Container.propTypes = {
  dimensions: PropTypes.object.isRequired,
  disabled: PropTypes.bool.isRequired,
  hotspotColor: PropTypes.string.isRequired,
  hoverOutlineColor: PropTypes.string,
  imageUrl: PropTypes.string.isRequired,
  isEvaluateMode: PropTypes.bool.isRequired,
  language: PropTypes.string,
  onSelectChoice: PropTypes.func.isRequired,
  outlineColor: PropTypes.string.isRequired,
  selectedHotspotColor: PropTypes.string,
  session: PropTypes.object.isRequired,
  shapes: PropTypes.object.isRequired,
  strokeWidth: PropTypes.number,
  scale: PropTypes.number,
  showCorrect: PropTypes.bool,
};

Container.defaultProps = {
  scale: 1,
};

export default Container;
