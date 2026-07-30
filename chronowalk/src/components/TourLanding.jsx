import PreTourFlow from './pre-tour/PreTourFlow'

/**
 * Pre-tour onboarding — navigates between focused screens instead of one scrollable page.
 */
function TourLanding(props) {
  return <PreTourFlow {...props} />
}

export default TourLanding
