import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { getAuth, updateProfile} from 'firebase/auth'
import { updateDoc, doc, collection, getDocs, query, where, orderBy, deleteDoc, } from 'firebase/firestore'
import { db } from '../firebase.config'
import { getStorage, ref, deleteObject } from 'firebase/storage';

import { toast } from 'react-toastify'

import arrowRight from '../assets/svg/keyboardArrowRightIcon.svg'
import homeIcon from '../assets/svg/homeIcon.svg'
import ListingItem from '../components/ListingItem'

function Profile()
{
    const auth = getAuth()
    const [ formData, setFormData ] = useState( {name: auth.currentUser.displayName, email: auth.currentUser.email} )
    const { name, email } = formData
    const [ changeDetails, setChangeDetails ] = useState(false)
    const [loading, setLoading] = useState(true)
    const [listings, setListings] = useState(null)

    const navigate = useNavigate()

    useEffect(() => {
    
        const fetchUserListings = async () => 
        {
            const listingsRef = collection(db, 'listings')
      
            const q = query(
                listingsRef,
                where('userRef', '==', auth.currentUser.uid),
                orderBy('timestamp', 'desc')
            )
      
            const querySnap = await getDocs(q)
      
            let listings = []
      
            querySnap.forEach((doc) => {
                return listings.push( {id: doc.id, data: doc.data(),} )
            })
      
            setListings(listings)
            setLoading(false)
          }
      
          fetchUserListings()


    }, [auth.currentUser.uid])

    const onLogout = () =>
    {
        auth.signOut()
        navigate('/')
    }

    const onSubmit = async () => 
    {
        try 
        {
            if (auth.currentUser.displayName !== name) 
            {
                await updateProfile( auth.currentUser, {displayName: name,} )
        
                const userRef = doc(db, 'users', auth.currentUser.uid)
                await updateDoc( userRef, {name,} )
            }
        } 

        catch (error) 
        {
            toast.error('Could not update profile details')
        }
    }

    const onChange = (e) => 
    {
        setFormData( (prevState) => ( {...prevState, [e.target.id]: e.target.value,} ) )
    }

    const onDelete = async (listingId) =>
    {
        if (window.confirm('Are you sure you want to delete?')) 
        {
            await deleteDoc(doc(db, 'listings', listingId))
            const updatedListings = listings.filter(
              (listing) => listing.id !== listingId
            )
            setListings(updatedListings)
            toast.success('Successfully deleted listing')
        }

        const storage = getStorage();
    
        const imagesToDelete = listings.filter(
            (listing) => listing.id === listingId
        );
    
        const imagesArray = imagesToDelete[0].data.imageUrls;
    
        imagesArray.forEach( (urlToDelete) =>  {

            let fileName = urlToDelete.split('/').pop().split('#')[0].split('?')[0];
            fileName = fileName.replace('%2F', '/');
    
            const imageToDeleteRef = ref(storage, `${fileName}`);
            
            deleteObject(imageToDeleteRef)
            .then(() => {
                toast.success('Image deleted');
            })
            .catch((error) => {
                toast.error('Failed to delete images');
                console.log(error)
            });

        });
    }

    return (
        <>
            <div className='profile'>

                <header className='profileHeader'>
                    <p className='pageHeader'>MY PROFILE </p>
                    <button type='button' className='logOut' onClick={onLogout}> Logout </button>
                </header>

                <main> 
                    <div className='profileDetailsHeader'>
                        <p className='profileDetailsText'> Personal Details </p>
                        <p
                            className='changePersonalDetails'
                            onClick={ () => 
                            {
                                setChangeDetails((prevState) => !prevState)
                                changeDetails && onSubmit()
                            } }
                        >
                            {changeDetails ? 'done' : 'change'}
                        </p>
                    </div>

                    <div className='profileCard'>
                        <form>
                            <input
                                type='text'
                                id='name'
                                className={!changeDetails ? 'profileName' : 'profileNameActive'}
                                disabled={!changeDetails}
                                value={name}
                                onChange={onChange}
                            />
                            <p className={'profileEmail'}> {email} </p>
                        </form>
                    </div> 

                    <Link to='/create-listing' className='createListing'>
                        <img src={homeIcon} alt='home' />
                        <p> Sell or rent your home </p>
                        <img src={arrowRight} alt='arrow right' />
                    </Link>

                    {
                        !loading && listings?.length > 0 && 
                        (
                            <>
                                <p className='listingText'> Your Listings </p>
                                <ul className='listingsList'>
                                    {
                                        listings.map((listing) => (
                                            <ListingItem
                                                key={listing.id}
                                                listing={listing.data}
                                                id={listing.id}
                                                onDelete={() => onDelete(listing.id)}
                                            />
                                        ))
                                    }
                                </ul>
                            </>
                        )
                    }

                </main>
            </div>
        </>
    )
}

export default Profile