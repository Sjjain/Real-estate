/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.config'

import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import Spinner from '../components/Spinner'

function CreateListing() 
{
    const [geolocationEnabled, setGeolocationEnabled] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        type: 'rent',
        name: '',
        bedrooms: 1,
        bathrooms: 1,
        parking: false,
        furnished: false,
        address: '',
        offer: false,
        regularPrice: 0,
        discountedPrice: 0,
        images: {},
        latitude: 0,
        longitude: 0,
      })

      const {
        type,
        name,
        bedrooms,
        bathrooms,
        parking,
        furnished,
        address,
        offer,
        regularPrice,
        discountedPrice,
        images,
        latitude,
        longitude,
      } = formData

    const auth = getAuth()
    const navigate = useNavigate()

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) 
            {
                setFormData({ ...formData, userRef: user.uid })
            } 
            else 
            {
                navigate('/sign-in')
            }
        } )
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [] )

    const onSubmit = async (e) =>
    {
        e.preventDefault()

        setLoading(true)

        if (Number(discountedPrice) >= Number(regularPrice)) 
        {
            setLoading(false)
            toast.error('Discounted price needs to be less than regular price')
            return
        }

        if (images.length > 6) 
        {
            setLoading(false)
            toast.error('Max 6 images')
            return
        }

        let geolocation = {}
        let location
        

        if (geolocationEnabled) 
        {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`)

            const data = await response.json()

            geolocation.lat = data.results[0]?.geometry.location.lat ?? 0
            geolocation.lng = data.results[0]?.geometry.location.lng ?? 0

            location = data.status === 'ZERO_RESULTS' ? undefined : data.results[0]?.formatted_address

            if (location === undefined || location.includes('undefined')) 
            {
                setLoading(false)
                toast.error('Please enter a correct address')
                return
            }
        } 

        else 
        {
            geolocation.lat = latitude
            geolocation.lng = longitude
        }


        const storeImage = async (image) => 
        {
            return new Promise((resolve, reject) => 
            {
                const storage = getStorage()
                const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`
                const storageRef = ref(storage, "images/" + fileName)
          
                const uploadTask = uploadBytesResumable(storageRef, image)
           
                uploadTask.on(
                    'state_changed',
                    (snapshot) => 
                    {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                        console.log('Upload is ' + progress + '% done')
                        switch (snapshot.state) 
                        {
                            case 'paused':
                                console.log('Upload is paused')
                                break
                            case 'running':
                                console.log('Upload is running')
                                break
                            default:
                                break
                        }
                    },
                    (error) => 
                    {
                        reject(error)
                    },
                    () => 
                    {
                        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {resolve(downloadURL)})
                    }
                )
            })
        }
          
        const imageUrls = await Promise.all([...images].map((image) => storeImage(image)))
        .catch(() => {
            setLoading(false)
            toast.error('Images not uploaded')
            toast.error('Make sure each image is less than 2 MB')
            return
        } )     
        

        const formDataCopy = {...formData, imageUrls, geolocation, timestamp: serverTimestamp(),}
      
        formDataCopy.location = address
        delete formDataCopy.images
        delete formDataCopy.address
        !formDataCopy.offer && delete formDataCopy.discountedPrice
      
        const docRef = await addDoc(collection(db, 'listings'), formDataCopy)
        setLoading(false)
        toast.success('Listing saved')
        navigate(`/category/${formDataCopy.type}/${docRef.id}`)
    }

    const onMutate = (e) =>
    {
        e.preventDefault()

        let boolean = null
        if (e.target.value === 'true') 
        {
            boolean = true
        }
        if (e.target.value === 'false') 
        {
            boolean = false
        }

        if (e.target.files) 
        {
            setFormData((prevState) => ( {...prevState, images: e.target.files,} ))
        }
        
        if (!e.target.files) 
        {
            setFormData((prevState) => ( {...prevState, [e.target.id]: boolean ?? e.target.value,} ))
        }
    }

    if (loading) 
    {
        return <Spinner />
    }

    return (
        <div className='profile' style={{textAlign:"center"}}>

            <header>
                <p className='pageHeader'> CREATE YOUR LISTING </p>
            </header>

            <main>
                <form onSubmit={onSubmit}>

                    <label className='formLabel'> Sell / Rent </label>
                    <div className='formButtons'>
                        <button
                            type='button'
                            className={type === 'sale' ? 'formButtonActive' : 'formButton'}
                            id='type'
                            value='sale'
                            onClick={onMutate}
                            style={{margin: "10px 5px 20px auto"}}
                        >
                        Sell
                        </button>

                        <button
                            type='button'
                            className={type === 'rent' ? 'formButtonActive' : 'formButton'}
                            id='type'
                            value='rent'
                            onClick={onMutate}
                            style={{margin: "10px auto 20px 5px"}}
                        >
                        Rent
                        </button>
                    </div>

                    <label className='formLabel'> Name </label>
                    <input
                        className='formInputName'
                        type='text'
                        id='name'
                        value={name}
                        onChange={onMutate}
                        maxLength='32'
                        minLength='10'
                        required
                        style={{margin: "10px auto 20px"}}
                    />

                    <div className='formRooms flex'>
                        <div style={{margin: "10px 30px 20px auto"}}>
                            <label className='formLabel'> Bedrooms </label>
                            <input
                                className='formInputSmall'
                                type='number'
                                id='bedrooms'
                                value={bedrooms}
                                onChange={onMutate}
                                min='1'
                                max='50'
                                required
                                style={{margin: "10px auto 20px"}}
                                
                            />
                        </div>
                        <div style={{margin: "10px auto 20px 30px"}}>
                            <label className='formLabel'> Bathrooms </label>
                            <input
                                className='formInputSmall'
                                type='number'
                                id='bathrooms'
                                value={bathrooms}
                                onChange={onMutate}
                                min='1'
                                max='50'
                                required
                                style={{margin: "10px auto 20px"}}
                            />
                        </div>
                    </div>

                    <label className='formLabel'> Parking Spot </label>
                    <div className='formButtons'>
                        <button
                            className={parking ? 'formButtonActive' : 'formButton'}
                            type='button'
                            id='parking'
                            value={true}
                            onClick={onMutate}
                            min='1'
                            max='50'
                            style={{margin: "10px 5px 20px auto"}}
                        >
                        Yes
                        </button>
                        <button
                            className={!parking && parking !== null ? 'formButtonActive' : 'formButton'}
                            type='button'
                            id='parking'
                            value={false}
                            onClick={onMutate}
                            style={{margin: "10px auto 20px 5px"}}
                        >
                        No
                        </button>
                    </div>

                    <label className='formLabel'> Furnished </label>
                    <div className='formButtons'>
                        <button
                            className={furnished ? 'formButtonActive' : 'formButton'}
                            type='button'
                            id='furnished'
                            value={true}
                            onClick={onMutate}
                            style={{margin: "10px 5px 20px auto"}}
                        >
                        Yes
                        </button>
                        <button
                            className={!furnished && furnished !== null ? 'formButtonActive' : 'formButton'}
                            type='button'
                            id='furnished'
                            value={false}
                            onClick={onMutate}
                            style={{margin: "10px auto 20px 5px"}}
                        >
                        No
                        </button>
                    </div>

                    <label className='formLabel'> Address </label>
                    <textarea
                        className='formInputAddress'
                        type='text'
                        id='address'
                        value={address}
                        onChange={onMutate}
                        required
                        style={{margin: "10px auto 20px"}}
                    />

                   {/*  {
                        !geolocationEnabled && (
                            <div className='formLatLng flex'>
                                <div>
                                    <label className='formLabel'> Latitude </label>
                                    <input
                                        className='formInputSmall'
                                        type='number'
                                        id='latitude'
                                        value={latitude}
                                        onChange={onMutate}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='formLabel'> Longitude </label>
                                    <input
                                        className='formInputSmall'
                                        type='number'
                                        id='longitude'
                                        value={longitude}
                                        onChange={onMutate}
                                        required
                                    />
                                </div>
                            </div>
                        )
                    }
 */}
                    <label className='formLabel'> Offer </label>
                    <div className='formButtons'>
                        <button
                            className={offer ? 'formButtonActive' : 'formButton'}
                            type='button'
                            id='offer'
                            value={true}
                            onClick={onMutate}
                            style={{margin: "10px 5px 20px auto"}}
                        >
                        Yes
                        </button>
                        <button
                            className={!offer && offer !== null ? 'formButtonActive' : 'formButton'}
                            type='button'
                            id='offer'
                            value={false}
                            onClick={onMutate}
                            style={{margin: "10px auto 20px 5px"}}
                        >
                        No
                        </button>
                    </div>

                    <label className='formLabel'>Regular Price</label>
                    {
                        type === 'sale' && (
                            <div className='formPriceDiv'>
                                <input
                                    className='formInputSmall'
                                    type='number'
                                    id='regularPrice'
                                    value={regularPrice}
                                    onChange={onMutate}
                                    min='50'
                                    max='750000000'
                                    required
                                    style={{margin: "10px auto 20px"}}
                                />
                            </div>
                        )
                    }

                    {
                        type === 'rent' && (
                            <div className='formPriceDiv'>
                                <input
                                    className='formInputSmall'
                                    type='number'
                                    id='regularPrice'
                                    value={regularPrice}
                                    onChange={onMutate}
                                    min='50'
                                    max='750000000'
                                    required
                                    style={{margin: "10px 5px 20px auto"}}
                                />
                                <p style={{margin: "10px auto 20px 5px"}} className='formPriceText'> $ / Month </p>
                            </div>
                        )
                    }


                    {
                        offer && (
                            <>
                                <label className='formLabel'> Discounted Price </label>
                                <input
                                    className='formInputSmall'
                                    type='number'
                                    id='discountedPrice'
                                    value={discountedPrice}
                                    onChange={onMutate}
                                    min='50'
                                    max='750000000'
                                    required={offer}
                                    style={{margin: "10px auto 20px"}}
                                />
                            </>
                        )
                    } 

                    <label className='formLabel'> Images (Max 6)</label>
                    <br/>      
                    <input
                        className='formInputFile'
                        type='file'
                        id='images'
                        onChange={onMutate}
                        max='6'
                        accept='.jpg,.png,.jpeg'
                        multiple
                        required
                        style={{display:"none"}}
                    />
                    <label 
                        htmlFor="images" 
                        className='primaryButton'
                        style={{ width:"10em" }}
                    >
                        Choose Files
                    </label>

                    {
                        images.length>0 &&
                        (
                            <p style={{fontSize:"1.2rem"}}> ({images.length}/6) Uploaded&#9989; </p>
                        )
                    }
                    
                    <button type='submit' className='primaryButton createListingButton'>
                        Create Listing
                    </button>

                </form>
            </main>

        </div>
    )
}

export default CreateListing