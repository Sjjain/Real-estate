import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { getAuth } from 'firebase/auth'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.config'

import Spinner from '../components/Spinner'
import shareIcon from '../assets/svg/shareIcon.svg'

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

function Listing() 
{
    const [listing, setListing] = useState(null)
    const [loading, setLoading] = useState(true)
    const [shareLinkCopied, setShareLinkCopied] = useState(false)

    const navigate = useNavigate()
    const params = useParams()
    const auth = getAuth()

    useEffect(() =>  {
        const fetchListing = async () => 
        {
            const docRef = doc(db, 'listings', params.listingId)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) 
            {
                setListing(docSnap.data())
                setLoading(false)
            }
        }

        fetchListing()
    }, [navigate, params.listingId] )

    if (loading) 
    {
        return <Spinner />
    }

    return (
        <main>
            
            <div
                className='shareIconDiv'
                onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    setShareLinkCopied(true)
                    setTimeout(() => { setShareLinkCopied(false) }, 2000)
                } }
            >
                <img src={shareIcon} alt='' />
            </div>

            {shareLinkCopied && <p className='linkCopied'> Link Copied! </p>}

            <div className='listingDetails'>

                <p className='listingName'>
                    {listing.name} - $
                    {
                        listing.offer ? 
                            listing.discountedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        : 
                            listing.regularPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                </p>

                <p className='listingLocation'> {listing.location} </p>

                <p className='listingType' style={{fontSize:"small"}}>
                    For {listing.type === 'rent' ? 'Rent' : 'Sale'}
                </p>

                {
                    listing.offer && 
                    (
                        <p className='discountPrice' style={{fontSize:"small"}}>
                            ${listing.regularPrice - listing.discountedPrice} Discount
                        </p>
                    )
                }

                <ul className='listingDetailsList'>
                    <li>
                        {listing.bedrooms > 1 ? `${listing.bedrooms} Bedrooms` : '1 Bedroom'}
                    </li>
                    <li>
                        {listing.bathrooms > 1 ? `${listing.bathrooms} Bathrooms` : '1 Bathroom'}
                    </li>
                    <li>
                        {listing.parking && 'Parking Spot'}
                    </li>
                    <li>
                        {listing.furnished && 'Furnished'}
                    </li>
                </ul>

                <div className='fancyboxContainer'>
                    {
                        listing.imageUrls.map( (img,i) => (
                            <div className='fancyboxGridItems' key={i}>
                                <a data-fancybox="gallery" href={img} >
                                    <img alt='' src={img} />
                                </a>
                            </div>
                        ) )
                    }
                
                </div>

                {/* <p className='listingLocationTitle'> Location </p> */}

                {/* <div className='leafletContainer'>
                    <MapContainer
                        style={{ height: '100%', width: '100%' }}
                        center={[listing.geolocation.lat, listing.geolocation.lng]}
                        zoom={13}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url='https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png'
                        />

                        <Marker
                            position={[listing.geolocation.lat, listing.geolocation.lng]}
                        >
                            <Popup> {listing.location} </Popup>
                        </Marker>

                    </MapContainer>
                </div> */}

                <br />
                
                {
                    auth.currentUser?.uid !== listing.userRef && 
                    (
                        <Link
                            to={`/contact/${listing.userRef}?listingName=${listing.name}`}
                            className='primaryButton'
                        >
                            Contact Landlord
                        </Link>
                    )
                } 

            </div>
            
        </main>
    )
}

export default Listing


