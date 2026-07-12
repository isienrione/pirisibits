import WalkingCompanionScreen from './WalkingCompanionScreen.jsx'

/** Transit between stops — delegates to the unified walking companion layout. */
export default function C2Transit({
  destinationTitle: _destinationTitle,
  onArriveAtDestination,
  onBeginChapter,
  atDestination,
  arrived = atDestination,
  near = false,
  stopKey,
  title,
  note: _note,
  ...rest
}) {
  return (
    <WalkingCompanionScreen
      {...rest}
      mode="transit"
      title={title}
      stopKey={stopKey}
      testId="transit-screen"
      onBeginChapter={onBeginChapter ?? onArriveAtDestination}
      arrived={arrived}
      near={near}
    />
  )
}
