using System.ComponentModel.DataAnnotations;


namespace TT_API.Models
{
    public class Overlay
    {

        [Key]
        public int OverlayID { get; set; }
        public int IDMap { get; set; }
        public byte[] overlay { get; set; }
    }
}
